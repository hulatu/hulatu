#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""hulatu.com 的本地博客后台（服务端）。

一个只跑在本机的网页界面，用来替掉「hugo new → 编辑器 → git 命令」这条手工链路：
文章列表 / 新建 / 改 front matter / 写正文 / 本地预览 / 一键发布，都在浏览器里点。

四条设计约束（和这个仓库原本的维护文化对齐，别轻易破）：

  1. **零第三方依赖** —— 只用 Python 3 标准库。不给仓库引入 requirements.txt，
     也不要求装 Flask。换台机器只要有 python3 就能跑。
  2. **不重排 front matter** —— 全部走 scripts/_frontmatter.py 那套「按行改字段」。
     中文注释、对齐空格、字段顺序、空行原样保留，git diff 里只有真正改过的那一行。
     绝对不要为了省事改成「yaml 解析 → dump 回去」——那会把注释和空行全吃掉。
  3. **不自己算 URL** —— permalink 一律问 `hugo list all`。slug / 日期规则在
     hugo.toml 的 [permalinks] 里已经定义过一次了，后台再实现一遍必然漂移。
  4. **只监听 127.0.0.1**，且所有文件路径都锁在 content/ 内（防目录穿越）。

启动：python3 admin/server.py   （或双击根目录的「博客后台.command」）
"""

from __future__ import annotations

import csv
import io
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# ---------------------------------------------------------------------------
# 常量与路径
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
UI_DIR = Path(__file__).resolve().parent / "ui"
CONTENT = ROOT / "content"

# 复用 scripts/ 下那份 front matter 实现，别再写第二份正则（见该文件顶部注释）。
sys.path.insert(0, str(ROOT / "scripts"))
import _frontmatter as fm  # noqa: E402

HOST = "127.0.0.1"
ADMIN_PORT = int(os.environ.get("BLOG_ADMIN_PORT", "8787"))
HUGO_PORT = int(os.environ.get("BLOG_HUGO_PORT", "1313"))

# 三个「集合」。dir 是相对仓库根的目录，archetype 传给 `hugo new --kind`。
KINDS: dict[str, dict] = {
    "posts": {"dir": "content/posts", "label": "文章", "archetype": "posts"},
    "weekly": {"dir": "content/weekly", "label": "周刊", "archetype": "weekly"},
    "pages": {"dir": "content", "label": "页面", "archetype": "page"},
}

# front matter 字段分三类处理，决定值怎么写回文件。
LIST_FIELDS = {"categories", "tags", "keywords", "aliases"}          # 写成 ["a", "b"]
BOOL_FIELDS = {"draft", "comments", "noindex", "featured"}           # 写成 true / false
RAW_FIELDS = {"date", "lastmod", "publishDate", "expiryDate", "issue", "weight"}  # 不加引号
# 后台不允许改的字段：lastmod 由 publish.sh 的 sync-lastmod.py 自动刷（见 MAINTENANCE.md）
READONLY_FIELDS = {"lastmod"}

# 表单里会出现的全部字段（读文件时按这个清单去捞）
KNOWN_FIELDS = sorted(LIST_FIELDS | BOOL_FIELDS | RAW_FIELDS | {
    "title", "slug", "summary", "description", "series", "layout", "url", "cover",
})

# `hugo new` 生成的文件里，正文开头那段「发布前检查」HTML 注释。
# 后台已经把那些事做成表单了，留着只会让正文第一屏是一大坨注释。
_HTML_COMMENT = re.compile(r"<!--.*?-->\s*", re.S)
_BODY_PLACEHOLDER = re.compile(r"^在这里开始写作……[ \t]*\n?", re.M)
# archetype 里那行 `# ===== 文章设置（写完正文后，在这里调整）=====` 的横幅。
# 2026-10-07 用户手工把 4 篇历史文件里的这行清掉了，新建时也不该再生成。
_FM_BANNER = re.compile(r"^#[ \t]*=+[^\n]*=+[ \t]*\n", re.M)
# archetype 里的空数组占位 `[""]`，清成 `[]`，免得 Hugo 把空字符串当成一个真标签
_EMPTY_LIST_LITERAL = re.compile(r"^(\s*(?:categories|tags|keywords|aliases):\s*)\[\s*\"\"\s*\]", re.M)


# ---------------------------------------------------------------------------
# 小工具
# ---------------------------------------------------------------------------

def relpath(p: Path) -> str:
    """仓库内的相对路径，统一用 / 分隔（前端只认这种形式）。"""
    return p.relative_to(ROOT).as_posix()


def run(cmd: list[str], cwd: Path = ROOT, timeout: int = 60) -> subprocess.CompletedProcess:
    """跑一条命令，永不抛异常（失败时返回 returncode != 0 的结果）。"""
    try:
        return subprocess.run(
            cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout,
        )
    except Exception as exc:  # noqa: BLE001 - 命令缺失/超时都当成「没跑成」
        return subprocess.CompletedProcess(cmd, 127, "", str(exc))


def which_hugo() -> str:
    return shutil.which("hugo") or "/opt/homebrew/bin/hugo"


def port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.25)
        return s.connect_ex((HOST, port)) == 0


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def content_path(rel: str) -> Path:
    """把前端传来的相对路径解析成 content/ 下的真实文件，越界直接拒绝。"""
    if not rel:
        raise ValueError("缺少 path 参数")
    p = (ROOT / rel).resolve()
    if CONTENT not in p.parents:
        raise ValueError("路径越界：只能操作 content/ 下的文件")
    if p.suffix.lower() != ".md":
        raise ValueError("只允许操作 .md 文件")
    return p


# ---------------------------------------------------------------------------
# front matter 编解码
# ---------------------------------------------------------------------------

def split_flow_list(raw: str) -> list[str]:
    """解析 `["a", "b"]` 这种流式 YAML 列表；带引号/逗号/转义都能吃。

    本仓库 content/ 下所有列表都是单行流式写法（没有块级 `- item`），
    所以这里不需要真的 YAML 解析器。
    """
    s = raw.strip()
    if not s or s == "[]":
        return []
    if s.startswith("[") and s.endswith("]"):
        s = s[1:-1]
    items: list[str] = []
    buf: list[str] = []
    quote: str | None = None
    i = 0
    while i < len(s):
        c = s[i]
        if quote:
            if c == "\\" and i + 1 < len(s):
                buf.append(s[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
            else:
                buf.append(c)
        elif c in "\"'":
            quote = c
        elif c == ",":
            items.append("".join(buf).strip())
            buf = []
        else:
            buf.append(c)
        i += 1
    items.append("".join(buf).strip())
    return [x for x in items if x]


def decode_value(key: str, raw: str):
    """front matter 里的原始文本 → 给前端用的值。"""
    if key in LIST_FIELDS:
        return split_flow_list(raw)
    if key in BOOL_FIELDS:
        return raw.strip().lower() in ("true", "yes", "1")
    return raw


def encode_value(key: str, value) -> str:
    """前端传来的值 → 写回 front matter 那一行的文本。"""
    if key in LIST_FIELDS:
        items = value if isinstance(value, list) else [value]
        items = [str(x).strip() for x in items if str(x).strip()]
        # 一律带引号，和仓库现有写法一致：tags: ["零食", "大餐"]
        return "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in items) + "]"
    if key in BOOL_FIELDS:
        truthy = value is True or str(value).strip().lower() in ("true", "yes", "1")
        return "true" if truthy else "false"
    if key in RAW_FIELDS:
        return str(value).strip()
    return json.dumps(str(value), ensure_ascii=False)


def strip_inline_comment(raw: str) -> str:
    """去掉 YAML 行尾注释：`""     # 可选：连载…` → `""`。

    为什么需要这个：archetype 里 `series` 那行是带说明注释的，Hugo 会忽略注释，
    但「按行取值」的正则会把它整段当值读回来。引号里的 # 不能算注释
    （YAML 的规则是 # 前面必须有空白才算），所以这里要跟着引号状态走。
    """
    out: list[str] = []
    quote: str | None = None
    i = 0
    while i < len(raw):
        c = raw[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < len(raw):
                out.append(raw[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'":
            quote = c
            out.append(c)
        elif c == "#" and (not out or out[-1] in " \t"):
            break
        else:
            out.append(c)
        i += 1
    return "".join(out).rstrip()


_QUOTED = re.compile(r'^(["\'])(.*)\1$', re.S)


def unquote(s: str) -> str:
    s = s.strip()
    m = _QUOTED.match(s)
    return m.group(2) if m else s


def read_field_raw(text: str, key: str) -> str | None:
    """读字段那一行的值部分（去掉行尾注释，但保留引号）；没有这个字段返回 None。"""
    parts = fm.split(text)
    if not parts:
        return None
    m = re.search(rf"^{re.escape(key)}:[ \t]*(.*)$", parts[0], re.M)
    if not m:
        return None
    return strip_inline_comment(m.group(1))


def same_value(key: str, a: str, b: str) -> bool:
    """两个「值文本」在语义上是否相同（用来决定要不要重写那一行）。"""
    try:
        return decode_value(key, unquote(a)) == decode_value(key, unquote(b))
    except Exception:  # noqa: BLE001
        return a.strip() == b.strip()


def parse_front(text: str) -> dict:
    """捞出已知字段（值已解码）。未知字段和嵌套块（如 about.md 的 `about:`）不碰。"""
    if not fm.split(text):
        return {}
    out: dict = {}
    for key in KNOWN_FIELDS:
        raw = read_field_raw(text, key)
        if raw is None:
            continue
        out[key] = decode_value(key, unquote(raw))
    return out


def count_words(body: str) -> int:
    """粗估字数：去掉 Markdown 标记和空白后数字符。

    只用于列表里显示一个大概量级，不追求和 Hugo 的 .WordCount 完全一致
    （Hugo 对中日韩文字按「一个字算一个词」计）。
    """
    s = re.sub(r"```.*?```", " ", body, flags=re.S)      # 代码块
    s = re.sub(r"`[^`]*`", " ", s)                        # 行内代码
    s = re.sub(r"!?\[[^\]]*\]\([^)]*\)", " ", s)          # 链接与图片
    s = re.sub(r"^\s{0,3}#{1,6}\s+", "", s, flags=re.M)   # 标题号
    s = re.sub(r"[*_>`~\-|]+", " ", s)                    # 其它标记
    return len(re.sub(r"\s+", "", s))


# ---------------------------------------------------------------------------
# hugo 集成
# ---------------------------------------------------------------------------

_PERMA_CACHE: dict = {"t": 0.0, "data": {}}


def hugo_permalinks(force: bool = False) -> dict[str, str]:
    """`hugo list all` → {content 相对路径: 绝对 permalink}。

    为什么不自己按 [permalinks] 拼 URL：slug 为空时 Hugo 会用文件名（中文会被
    urlize），日期又可能被 publishDate 覆盖。规则只该有一份实现，那份在 hugo 里。
    """
    if not force and time.time() - _PERMA_CACHE["t"] < 5:
        return _PERMA_CACHE["data"]

    result: dict[str, str] = {}
    proc = run([which_hugo(), "list", "all"], timeout=90)
    if proc.returncode == 0 and proc.stdout:
        reader = csv.reader(io.StringIO(proc.stdout))
        header = next(reader, None) or []
        idx = {name: i for i, name in enumerate(header)}
        pi, li = idx.get("path"), idx.get("permalink")
        if pi is not None and li is not None:
            for row in reader:
                if len(row) <= max(pi, li):
                    continue
                if not row[pi].startswith("content/"):
                    continue
                result[row[pi]] = row[li]

    _PERMA_CACHE.update(t=time.time(), data=result)
    return result


def permalink_path(permalink: str) -> str:
    """绝对 permalink → 站内路径（拼预览 iframe 用）。"""
    return urllib.parse.urlsplit(permalink).path or "/"


def doc_meta(p: Path, kind: str, perma: dict[str, str]) -> dict:
    text = p.read_text(encoding="utf-8")
    parts = fm.split(text)
    front, body = parts if parts else ("", text)
    fields = parse_front(text)
    st = p.stat()
    link = perma.get(relpath(p), "")
    return {
        "path": relpath(p),
        "kind": kind,
        "file": p.name,
        "fields": fields,
        "words": count_words(body),
        "chars": len(body),
        "mtime": int(st.st_mtime),
        "mtimeText": datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M"),
        "permalink": link,
        "url": permalink_path(link),
        "hasFrontMatter": bool(parts),
    }


def scan_docs() -> list[dict]:
    perma = hugo_permalinks()
    out: list[dict] = []
    for kind, spec in KINDS.items():
        d = ROOT / spec["dir"]
        if not d.is_dir():
            continue
        for p in d.glob("*.md"):
            if p.name.startswith("_"):      # _index.md 是栏目页，不在列表里出现
                continue
            if kind == "pages" and p.parent != d:
                continue
            try:
                out.append(doc_meta(p, kind, perma))
            except Exception as exc:  # noqa: BLE001 - 单个文件读坏不该拖垮整个列表
                out.append({
                    "path": relpath(p), "kind": kind, "file": p.name,
                    "fields": {}, "words": 0, "chars": 0, "mtime": 0,
                    "mtimeText": "", "permalink": "", "url": "",
                    "hasFrontMatter": False, "error": str(exc),
                })
    return out


def taxonomy() -> dict:
    cats: dict[str, int] = {}
    tags: dict[str, int] = {}
    series: dict[str, int] = {}
    for doc in scan_docs():
        f = doc["fields"]
        for c in f.get("categories") or []:
            cats[c] = cats.get(c, 0) + 1
        for t in f.get("tags") or []:
            tags[t] = tags.get(t, 0) + 1
        s = f.get("series")
        if s:
            series[s] = series.get(s, 0) + 1

    def pack(d: dict[str, int]) -> list[dict]:
        return [{"name": k, "count": v} for k, v in sorted(d.items(), key=lambda kv: (-kv[1], kv[0]))]

    return {"categories": pack(cats), "tags": pack(tags), "series": pack(series)}


# ---------------------------------------------------------------------------
# 读写文章
# ---------------------------------------------------------------------------

def read_doc(rel: str) -> dict:
    p = content_path(rel)
    if not p.is_file():
        raise FileNotFoundError(rel)
    text = p.read_text(encoding="utf-8")
    parts = fm.split(text)
    front, body = parts if parts else ("", text)
    perma = hugo_permalinks()
    meta = doc_meta(p, kind_of(rel), perma)
    meta["frontRaw"] = front
    meta["body"] = body
    meta["text"] = text
    return meta


def kind_of(rel: str) -> str:
    if rel.startswith("content/posts/"):
        return "posts"
    if rel.startswith("content/weekly/"):
        return "weekly"
    return "pages"


def save_doc(rel: str, fields: dict | None, body: str | None,
             front_raw: str | None = None) -> dict:
    """保存一篇文章。

    fields 走「按行替换」；front_raw 是源码模式下整块替换 front matter。
    两者互斥（源码模式整块替换，表单模式逐字段替换）。
    """
    p = content_path(rel)
    if not p.is_file():
        raise FileNotFoundError(rel)
    text = p.read_text(encoding="utf-8")
    if not fm.split(text):
        raise ValueError("这个文件没有 YAML front matter，后台不敢动它")

    if front_raw is not None:
        # 源码模式：前端把整块 front matter 原样发回来，只做最低限度的体检
        block = front_raw.strip("\n")
        if block.startswith("---"):
            block = block[4:].lstrip("\n")
        if block.rstrip().endswith("---"):
            block = block.rstrip()[:-3].rstrip("\n")
        if re.search(r"^---\s*$", block, re.M):
            raise ValueError("front matter 里出现了多余的 --- 分隔线")
        m = fm.FRONT_MATTER.match(text)
        text = "---\n" + block + "\n---\n" + text[m.end():]
    else:
        for key, value in (fields or {}).items():
            if key in READONLY_FIELDS:
                continue
            new_raw = encode_value(key, value)
            # 值没变就**不要碰那一行** —— 前端每次保存会把整张表单发过来，
            # 无脑重写会让没改过的字段也进 git diff，还会顺手抹掉行尾的说明注释。
            cur_raw = read_field_raw(text, key)
            if cur_raw is not None and same_value(key, cur_raw, new_raw):
                continue
            text, _ = fm.write(text, key, new_raw, after="date")

    if body is not None:
        m = fm.FRONT_MATTER.match(text)
        text = text[: m.end()] + body

    p.write_text(text, encoding="utf-8")
    hugo_permalinks(force=True)
    return read_doc(rel)


# ---------------------------------------------------------------------------
# 中文标题 → ASCII slug（建议用，不强制）
# ---------------------------------------------------------------------------

# 和 scripts/add-heading-anchors.py 用的是同一招：把转写交给 macOS 自带的
# Foundation（NSStringTransformToLatin），不装任何依赖、不用自建字表。
# 这个接口只用来「给个建议」，失败就返回空串，前端让用户自己填 —— 不能因为
# 转写不了就把新建流程卡住。
_SLUG_JXA = r"""
function run(argv) {
  ObjC.import("Foundation");
  var s = $.NSMutableString.alloc.initWithString(argv.join("\n"));
  var latin = s.stringByApplyingTransformReverse($.NSStringTransformToLatin, false);
  var plain = latin.stringByApplyingTransformReverse($.NSStringTransformStripDiacritics, false);
  return ObjC.unwrap(plain) + "";
}
"""
_SLUG_CACHE: dict[str, str] = {}
_CJK = re.compile(r"[\u3005\u3007\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")


def slugify(text: str, max_segments: int = 6) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return "-".join([p for p in text.split("-") if p][:max_segments])


def suggest_slug(title: str) -> str:
    """中文标题 → 拼音 slug（前 6 段）。纯 ASCII 标题直接走 slugify。"""
    title = (title or "").strip()
    if not title:
        return ""
    if title in _SLUG_CACHE:
        return _SLUG_CACHE[title]
    if not _CJK.search(title):
        out = slugify(title)
    else:
        try:
            proc = subprocess.run(
                ["osascript", "-l", "JavaScript", "-e", _SLUG_JXA, title],
                capture_output=True, text=True, timeout=15, check=True,
            )
            out = slugify(proc.stdout.strip())
        except Exception:  # noqa: BLE001 - 非 macOS / osascript 被拦，都不该阻断新建
            out = ""
    _SLUG_CACHE[title] = out
    return out


# ---------------------------------------------------------------------------
# 新建 / 删除
# ---------------------------------------------------------------------------

_CN_DIGITS = "零一二三四五六七八九"


def cn_number(n: int) -> str:
    """1 → 一，24 → 二十四，30 → 三十，105 → 一百零五。周刊文件名要用。"""
    if n < 10:
        return _CN_DIGITS[n]
    if n < 20:
        return "十" + (_CN_DIGITS[n % 10] if n % 10 else "")
    if n < 100:
        return _CN_DIGITS[n // 10] + "十" + (_CN_DIGITS[n % 10] if n % 10 else "")
    if n < 1000:
        rest = n % 100
        return _CN_DIGITS[n // 100] + "百" + (("零" + cn_number(rest)) if rest and rest < 10 else (cn_number(rest) if rest else ""))
    return str(n)


def next_issue() -> int:
    """现有周刊的最大期号 + 1。"""
    top = 0
    d = ROOT / KINDS["weekly"]["dir"]
    for p in d.glob("*.md"):
        try:
            raw = read_field_raw(p.read_text(encoding="utf-8"), "issue")
        except Exception:  # noqa: BLE001
            continue
        if raw and unquote(raw).strip().isdigit():
            top = max(top, int(unquote(raw).strip()))
    return top + 1


def safe_filename(name: str) -> str:
    """文件名只允许去掉路径分隔符和控制字符，中文原样保留（和现有文件一致）。"""
    name = (name or "").strip()
    name = name.replace("/", "-").replace("\\", "-").replace(":", "：")
    name = re.sub(r"[\x00-\x1f]", "", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return name


def create_doc(payload: dict) -> dict:
    kind = payload.get("kind") or "posts"
    if kind not in KINDS:
        raise ValueError("未知的内容类型")
    spec = KINDS[kind]

    title = (payload.get("title") or "").strip()
    filename = safe_filename(payload.get("filename") or title)
    if not filename:
        raise ValueError("标题不能为空")
    if not filename.endswith(".md"):
        filename += ".md"

    target = ROOT / spec["dir"] / filename
    if target.exists():
        raise FileExistsError(f"{relpath(target)} 已经存在了")

    # 用 hugo new 生成骨架 —— archetypes/ 才是字段清单的唯一出处，
    # 后台只做「清掉注释块 + 填字段」的后处理，不自己拼 front matter。
    cmd = [which_hugo(), "new", relpath(target)]
    if kind == "pages":
        cmd += ["--kind", "page"]
    proc = run(cmd, timeout=30)
    if proc.returncode != 0 or not target.exists():
        raise RuntimeError(f"hugo new 失败：{(proc.stderr or proc.stdout or '').strip()}")

    text = target.read_text(encoding="utf-8")
    text = _FM_BANNER.sub("", text)
    text = _HTML_COMMENT.sub("", text)
    text = _BODY_PLACEHOLDER.sub("", text)
    text = _EMPTY_LIST_LITERAL.sub(r"\1[]", text)

    # 写回骨架时先落盘再走 save_doc，保证「字段写入」只有一条代码路径
    target.write_text(text, encoding="utf-8")

    fields: dict = {"title": title}
    for key in ("slug", "summary", "description", "series", "layout", "categories",
                "tags", "issue", "draft", "comments", "noindex", "date"):
        if key in payload and payload[key] not in (None, ""):
            fields[key] = payload[key]
    fields.setdefault("draft", True)
    if kind == "pages" and "comments" not in fields:
        fields["comments"] = False

    doc = save_doc(relpath(target), fields, body=None)

    # 「加入顶部导航」：直接往 hugo.toml 的 [menu] 段追加一条
    if payload.get("addToMenu"):
        add_menu_item(
            payload.get("menuName") or title,
            "/" + Path(filename).stem + "/",
            int(payload.get("menuWeight") or 0),
        )
        doc["menuAdded"] = True

    return doc


def trash_doc(rel: str) -> str:
    """把文件挪到废纸篓（不是 rm）。后台永远不做不可逆删除。"""
    p = content_path(rel)
    if not p.is_file():
        raise FileNotFoundError(rel)
    # 只挡栏目的 _index.md —— 不能写成 startswith("_")，那样连正常的
    # `_草稿.md` 这种以短横线开头的文件名也会被误伤。
    if p.name == "_index.md":
        raise ValueError("_index.md 是栏目页，后台不允许删除")
    trash = Path.home() / ".Trash"
    if not trash.is_dir():
        raise RuntimeError("找不到废纸篓目录，已放弃删除")
    dest = trash / p.name
    if dest.exists():
        dest = trash / f"{p.stem}-{datetime.now():%Y%m%d%H%M%S}{p.suffix}"
    shutil.move(str(p), str(dest))
    hugo_permalinks(force=True)
    return str(dest)


# ---------------------------------------------------------------------------
# 图片上传
# ---------------------------------------------------------------------------

UPLOAD_DIR = ROOT / "static" / "images" / "uploads"
_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp"}


def save_upload(name: str, data: bytes) -> dict:
    """把拖进来的图片存进 static/images/uploads/，返回可直接写进 Markdown 的路径。

    注意：这个目录会随仓库提交（正文图走图床 img.hulatu.com 的旧习惯不受影响，
    这里只是给「随手截个图」用的快捷通道）。
    """
    name = urllib.parse.unquote(name or "image.png")
    ext = Path(name).suffix.lower()
    if ext not in _IMAGE_EXT:
        raise ValueError(f"不支持的图片格式：{ext or '(无扩展名)'}")
    if len(data) > 20 * 1024 * 1024:
        raise ValueError("图片超过 20MB，建议先压缩")
    stem = safe_filename(Path(name).stem) or "image"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    target = UPLOAD_DIR / f"{stem}{ext}"
    n = 1
    while target.exists():
        target = UPLOAD_DIR / f"{stem}-{n}{ext}"
        n += 1
    target.write_bytes(data)
    rel = "/" + relpath(target).removeprefix("static/")
    return {"src": rel, "path": relpath(target), "bytes": len(data)}


# ---------------------------------------------------------------------------
# 导航菜单（读改 hugo.toml 的 [menu] 段）
# ---------------------------------------------------------------------------

_MENU_HEAD = re.compile(r"^\[menu\][ \t]*$", re.M)


def menu_bounds(text: str) -> tuple[int, int]:
    """[menu] 段在文本里的 [起, 止) 字符偏移。"""
    head = _MENU_HEAD.search(text)
    if not head:
        raise ValueError("hugo.toml 里找不到 [menu] 段")
    rest = text[head.end():]
    stop = len(text)
    for m in re.finditer(r"^\[[^\]]", rest, re.M):
        line = rest[m.start(): rest.find("\n", m.start()) if "\n" in rest[m.start():] else len(rest)]
        if not line.startswith("[[menu."):
            stop = head.end() + m.start()
            break
    return head.start(), stop


def read_menu() -> list[dict]:
    text = (ROOT / "hugo.toml").read_text(encoding="utf-8")
    start, stop = menu_bounds(text)
    items: list[dict] = []
    cur: dict | None = None
    for line in text[start:stop].split("\n"):
        if line.strip() == "[[menu.main]]":
            cur = {}
            items.append(cur)
            continue
        if cur is None or line.lstrip().startswith("#"):
            continue
        m = re.match(r"\s*([A-Za-z_][\w-]*)\s*=\s*(.*?)\s*$", line)
        if m:
            cur[m.group(1)] = m.group(2).strip().strip('"')
    return items


def write_menu(items: list[dict]) -> None:
    """整段重写 [menu]，保留段前原有的注释（那些注释是在解释这个段怎么用）。"""
    path = ROOT / "hugo.toml"
    text = path.read_text(encoding="utf-8")
    start, stop = menu_bounds(text)
    block = text[start:stop]

    # 保住 `[menu]` 和第一条 [[menu.main]] 之间的注释行
    header: list[str] = []
    for line in block.split("\n")[1:]:
        if line.strip() == "[[menu.main]]":
            break
        header.append(line)
    while header and not header[-1].strip():
        header.pop()

    body = ["[menu]"] + header
    for it in items:
        body.append("  [[menu.main]]")
        body.append(f'    name = {json.dumps(str(it.get("name", "")), ensure_ascii=False)}')
        body.append(f'    url = {json.dumps(str(it.get("url", "")), ensure_ascii=False)}')
        body.append(f'    weight = {int(it.get("weight") or 0)}')
    new = "\n".join(body) + "\n\n"

    path.write_text(text[:start] + new + text[stop:].lstrip("\n"), encoding="utf-8")


def add_menu_item(name: str, url: str, weight: int = 0) -> None:
    items = read_menu()
    if any(i.get("url") == url for i in items):
        return
    if not weight:
        weight = max([int(i.get("weight") or 0) for i in items] + [0]) + 1
    items.append({"name": name, "url": url, "weight": weight})
    write_menu(items)


# ---------------------------------------------------------------------------
# 本地预览（hugo server 进程）
# ---------------------------------------------------------------------------

_PREVIEW: dict = {"proc": None, "log": []}
_PREVIEW_LOCK = threading.Lock()


def _pump(proc: subprocess.Popen) -> None:
    try:
        assert proc.stdout is not None
        for line in proc.stdout:
            with _PREVIEW_LOCK:
                _PREVIEW["log"].append(line.rstrip())
                del _PREVIEW["log"][:-80]
    except Exception:  # noqa: BLE001
        pass


def preview_status() -> dict:
    proc = _PREVIEW["proc"]
    managed = proc is not None and proc.poll() is None
    running = managed or port_open(HUGO_PORT)
    with _PREVIEW_LOCK:
        log = "\n".join(_PREVIEW["log"][-25:])
    return {
        "running": running, "managed": managed,
        "port": HUGO_PORT, "base": f"http://{HOST}:{HUGO_PORT}",
        "log": log,
        "external": running and not managed,   # 可能是用户自己在终端里起的
    }


def preview_start() -> dict:
    if port_open(HUGO_PORT):
        return preview_status()
    cmd = [
        which_hugo(), "server",
        "--buildDrafts",            # 草稿也要能预览。注意是 --buildDrafts，不是 --drafts
        "--renderToMemory",         # 关键：不写 public/，避免和 deploy.sh 的干净构建打架
        "--bind", HOST,
        "--port", str(HUGO_PORT),
        "--disableFastRender",      # 后台改 front matter 会动 URL，快速渲染有时会留旧页
    ]
    with _PREVIEW_LOCK:
        _PREVIEW["log"] = [f"$ {' '.join(cmd)}"]
    try:
        proc = subprocess.Popen(
            cmd, cwd=str(ROOT), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1,
        )
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"启动 hugo server 失败：{exc}") from exc
    _PREVIEW["proc"] = proc
    threading.Thread(target=_pump, args=(proc,), daemon=True).start()
    for _ in range(80):             # 最多等 20 秒
        if port_open(HUGO_PORT):
            break
        if proc.poll() is not None:
            break
        time.sleep(0.25)
    return preview_status()


def preview_stop() -> dict:
    proc = _PREVIEW["proc"]
    if proc is not None and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            proc.kill()
    _PREVIEW["proc"] = None
    return preview_status()


# ---------------------------------------------------------------------------
# 发布（流式返回 publish.sh 的输出）
# ---------------------------------------------------------------------------

def git_state() -> dict:
    branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
    st = run(["git", "status", "--porcelain"])
    lines = [l for l in st.stdout.split("\n") if l.strip()]
    ahead = run(["git", "rev-list", "--count", "@{u}..HEAD"]).stdout.strip()
    return {
        "branch": branch,
        "dirty": len(lines),
        "changes": lines[:60],
        "ahead": int(ahead) if ahead.isdigit() else 0,
    }


def site_state() -> dict:
    hv = run([which_hugo(), "version"]).stdout.strip()
    return {
        "root": str(ROOT),
        "title": "胡拉图说",
        "hugo": hv.split(" ")[0] if hv else "",
        "hugoFull": hv,
        "hugoOk": bool(hv),
        "python": sys.version.split()[0],
        "git": git_state(),
        "preview": preview_status(),
        "menu": read_menu(),
        "now": now_iso(),
    }


def publish_stream():
    """生成器：逐行产出 publish.sh 的输出（NDJSON）。"""
    if port_open(HUGO_PORT):
        # publish.sh 本身不构建，但 deploy.sh 会因为 1313 被占用而报警，
        # 所以发布前顺手把后台自己起的预览停掉（用户手动起的那个不动）。
        if _PREVIEW["proc"] is not None and _PREVIEW["proc"].poll() is None:
            yield {"type": "log", "line": "（先把后台起的本地预览停掉，免得占着 1313 端口）"}
            preview_stop()

    yield {"type": "log", "line": "$ ./publish.sh"}
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"     # 缺凭据时直接失败，不要挂在终端等输入
    env["PYTHONUNBUFFERED"] = "1"
    try:
        proc = subprocess.Popen(
            ["/bin/bash", str(ROOT / "publish.sh")], cwd=str(ROOT),
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1, env=env,
        )
    except Exception as exc:  # noqa: BLE001
        yield {"type": "log", "line": f"启动失败：{exc}"}
        yield {"type": "done", "ok": False, "code": -1}
        return

    assert proc.stdout is not None
    for line in proc.stdout:
        yield {"type": "log", "line": line.rstrip("\n")}
    code = proc.wait()
    _PERMA_CACHE["t"] = 0.0
    yield {"type": "done", "ok": code == 0, "code": code}


# ---------------------------------------------------------------------------
# HTTP 层
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "BlogAdmin/1.0"

    # 同一个连接会复用同一个 Handler 实例，所以这个缓存必须在每个请求开头重置
    _body_cache: bytes | None = None

    # ---- 基础收发 -------------------------------------------------------

    def log_message(self, fmt: str, *args) -> None:  # 静音默认的访问日志
        pass

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass

    def _json(self, data, code: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self._send(code, body, "application/json; charset=utf-8")

    def _err(self, exc: Exception, code: int = 400) -> None:
        self._json({"error": str(exc), "type": type(exc).__name__}, code)

    def _body(self) -> bytes:
        """读掉请求体，且**每个请求只读一次**。

        为什么必须每个 POST 路由都调一次：这是 HTTP/1.1 keep-alive 的硬要求。
        没读干净的字节会留在 socket 缓冲里，被当成下一个请求的请求行 ——
        于是下一个请求报 501（命令解析成了 `{}` 这种垃圾），而且只在「同一个连接
        连着发两个请求」时复现。curl 每次都新建连接，所以本地用 curl 测永远看不出来；
        浏览器的 fetch 会复用连接，一点「预览」再点「新建周刊」，期号就悄悄不填了。
        """
        if self._body_cache is None:
            n = int(self.headers.get("Content-Length") or 0)
            self._body_cache = self.rfile.read(n) if n else b""
        return self._body_cache

    def _read_json(self) -> dict:
        raw = self._body()
        if not raw:
            return {}
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:  # noqa: BLE001
            raise ValueError("请求体不是合法 JSON")

    def _query(self) -> dict:
        q = urllib.parse.urlsplit(self.path).query
        return {k: v[0] for k, v in urllib.parse.parse_qs(q).items()}

    # ---- 路由 -----------------------------------------------------------

    def do_GET(self) -> None:  # noqa: N802
        path = urllib.parse.urlsplit(self.path).path
        self._body_cache = None
        try:
            if path == "/" or path == "/index.html":
                return self._static("index.html", "text/html; charset=utf-8")
            if path.startswith("/ui/"):
                return self._static(path[len("/ui/"):])
            if path == "/favicon.svg":
                return self._send_file(ROOT / "static" / "favicon.svg", "image/svg+xml")
            if path == "/api/site":
                return self._json(site_state())
            if path == "/api/list":
                return self._json({"docs": scan_docs(), "taxonomy": taxonomy()})
            if path == "/api/doc":
                return self._json(read_doc(self._query().get("path", "")))
            if path == "/api/taxonomy":
                return self._json(taxonomy())
            if path == "/api/slug":
                return self._json({"slug": suggest_slug(self._query().get("title", ""))})
            if path == "/api/next-issue":
                n = next_issue()
                return self._json({
                    "issue": n,
                    "cn": cn_number(n),
                    "filename": f"胡拉图的周刊-第{cn_number(n)}期.md",
                    "slug": f"newsletter-{n}",
                })
            if path == "/api/preview":
                return self._json(preview_status())
            if path == "/api/menu":
                return self._json({"menu": read_menu()})
            if path == "/api/health":
                return self._json({"ok": True})
            return self._json({"error": "未知接口"}, 404)
        except FileNotFoundError as exc:
            return self._err(exc, 404)
        except Exception as exc:  # noqa: BLE001
            return self._err(exc, 500)

    def do_POST(self) -> None:  # noqa: N802
        path = urllib.parse.urlsplit(self.path).path
        self._body_cache = None
        self._body()          # 先把请求体读干净，见 _body() 的注释
        try:
            if path == "/api/save":
                p = self._read_json()
                return self._json(save_doc(
                    p.get("path", ""), p.get("fields"), p.get("body"),
                    p.get("frontRaw"),
                ))
            if path == "/api/create":
                return self._json(create_doc(self._read_json()))
            if path == "/api/trash":
                return self._json({"movedTo": trash_doc(self._read_json().get("path", ""))})
            if path == "/api/upload":
                return self._upload()
            if path == "/api/preview/start":
                return self._json(preview_start())
            if path == "/api/preview/stop":
                return self._json(preview_stop())
            if path == "/api/menu":
                items = self._read_json().get("menu")
                if not isinstance(items, list):
                    raise ValueError("menu 必须是数组")
                write_menu(items)
                return self._json({"menu": read_menu()})
            if path == "/api/publish":
                return self._publish()
            return self._json({"error": "未知接口"}, 404)
        except FileNotFoundError as exc:
            return self._err(exc, 404)
        except FileExistsError as exc:
            return self._err(exc, 409)
        except Exception as exc:  # noqa: BLE001
            return self._err(exc, 500)

    # ---- 静态文件 -------------------------------------------------------

    def _static(self, rel: str, ctype: str | None = None, root: Path | None = None) -> None:
        base = (root or UI_DIR).resolve()
        target = (base / rel).resolve()
        if base not in target.parents and target != base:
            return self._json({"error": "路径越界"}, 403)
        if not target.is_file():
            return self._json({"error": f"找不到 {rel}"}, 404)
        self._send_file(target, ctype)

    def _send_file(self, target: Path, ctype: str | None = None) -> None:
        if not target.is_file():
            return self._json({"error": f"找不到 {target.name}"}, 404)
        if ctype is None:
            ctype = {
                ".html": "text/html; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".js": "text/javascript; charset=utf-8",
                ".svg": "image/svg+xml",
                ".json": "application/json; charset=utf-8",
                ".png": "image/png",
                ".webp": "image/webp",
            }.get(target.suffix.lower(), "application/octet-stream")
        self._send(200, target.read_bytes(), ctype)

    # ---- 上传 -----------------------------------------------------------

    def _upload(self) -> None:
        data = self._body()
        if not data:
            raise ValueError("没有收到文件内容")
        name = self.headers.get("X-File-Name") or "image.png"
        self._json(save_upload(name, data))

    # ---- 流式发布 -------------------------------------------------------

    def _publish(self) -> None:
        # 请求体在 do_POST 开头已经读掉了（见 _body），这里不用再管

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Transfer-Encoding", "chunked")
        self.end_headers()

        def emit(obj) -> None:
            chunk = (json.dumps(obj, ensure_ascii=False) + "\n").encode("utf-8")
            try:
                self.wfile.write(b"%x\r\n" % len(chunk) + chunk + b"\r\n")
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                raise

        try:
            for event in publish_stream():
                emit(event)
            self.wfile.write(b"0\r\n\r\n")
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass    # 用户把标签页关了，发布进程继续在后台跑完，不用管


def main() -> int:
    port = ADMIN_PORT
    if port_open(port):
        print(f"端口 {port} 已被占用——后台可能已经开着了。", file=sys.stderr)
        print(f"直接打开：http://{HOST}:{port}/", file=sys.stderr)
        return 1

    open_browser = "--no-browser" not in sys.argv
    httpd = ThreadingHTTPServer((HOST, port), Handler)
    httpd.daemon_threads = True
    url = f"http://{HOST}:{port}/"

    print("─" * 56)
    print("  胡拉图说 · 博客后台")
    print(f"  地址   {url}")
    print(f"  仓库   {ROOT}")
    print("  停止   按 Control-C，或直接关掉这个终端窗口")
    print("─" * 56, flush=True)

    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    finally:
        if _PREVIEW["proc"] is not None and _PREVIEW["proc"].poll() is None:
            _PREVIEW["proc"].terminate()
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
