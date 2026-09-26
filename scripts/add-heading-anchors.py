#!/usr/bin/env python3
"""给中文标题补上可读的 ASCII 锚点：`## 习惯`  →  `## 习惯 {#xi-guan}`

为什么要有这个脚本：Hugo 默认拿标题原文当 id，中文标题分享出去就是
https://hulatu.com/posts/2026/09/17/embrace-english/#%e4%b9%a0%e6%83%af
这种百分号编码。标题后面显式写上 `{#xi-guan}` 之后，Hugo 的目录、正文标题上的
「#」按钮都会改用这个 id（layouts/_default/_markup/render-heading.html 用 .Anchor，
显式 id 优先），链接就变成 `#xi-guan`。

拼音转写用 macOS 自带的 Foundation（NSStringTransformToLatin），不装任何依赖，
所以「自动补锚点」这一步只能在 macOS 上跑（发布脚本 publish.sh 里会调，失败不阻断发布）。
想在别的机器上跑，用 --check 模式做检查是可以的（不需要转写）。

用法：
  python3 scripts/add-heading-anchors.py            # 补全：直接改写 content/ 下的 .md
  python3 scripts/add-heading-anchors.py --dry-run  # 只打印会补哪些，不写文件
  python3 scripts/add-heading-anchors.py --check    # 只检查：有该补没补的标题就退出码 1

不想用拼音的标题直接手改成英文词即可，比如 `## 习惯 {#habit}`；脚本看到已有 {#...}
就跳过，--check 也不会报。
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"

HEADING = re.compile(r"^(#{2,6})[ \t]+(.*)$")
FENCE = re.compile(r"^[ \t]*(`{3,}|~{3,})")
SETEXT = re.compile(r"^[ \t]*(=+|-{2,})[ \t]*$")
EXPLICIT_ID = re.compile(r"\{[^}]*#([^}\s]+)[^}]*\}")
CJK = re.compile(r"[\u3005\u3007\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")

# 拼音转写交给 macOS 的 Foundation：NSStringTransformToLatin 会按词给出带声调的拼音，
# 去掉声调后就是 xi guan 这种可读形式（多音字走系统词典，比自建字表靠谱）。
JXA = r"""
function run(argv) {
  ObjC.import("Foundation");
  var text = argv.join("\n");
  var s = $.NSMutableString.alloc.initWithString(text);
  var latin = s.stringByApplyingTransformReverse($.NSStringTransformToLatin, false);
  var plain = latin.stringByApplyingTransformReverse($.NSStringTransformStripDiacritics, false);
  return ObjC.unwrap(plain) + "";
}
"""


def strip_markup(text: str) -> str:
    """把标题里的 Markdown 装饰去掉，只留能读的文字，用来生成 id。"""
    text = EXPLICIT_ID.sub("", text)
    text = re.sub(r"\{[^}]*\}", "", text)          # 其余属性块（.class / 自定义）
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)  # 图片
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)  # 链接留文字
    text = re.sub(r"\[\^[^\]]*\]", "", text)       # 脚注引用
    text = re.sub(r"`([^`]*)`", r"\1", text)       # 行内代码
    text = re.sub(r"<[^>]+>", "", text)            # 行内 HTML
    text = re.sub(r"(\*\*|__|\*|_|~~)", "", text)  # 强调记号
    return text.strip()


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    # 超长标题只取前几段：`#ai-ju-ti-de-ren` 比把一整句话拼音铺满更好用，
    # 撞车由调用方补 -2 / -3。
    return "-".join(text.split("-")[:6])


def pinyin_slugs(texts: list[str]) -> list[str]:
    """批量转写：一次 osascript 调用把整批标题转成拼音，省掉 500 次进程启动。"""
    # 用 \n 分隔的批输入；标题里不可能有换行，所以回来按行对齐即可
    payload = "\n".join(text.replace("\n", " ") for text in texts)
    try:
        proc = subprocess.run(
            ["osascript", "-l", "JavaScript", "-e", JXA, payload],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        detail = getattr(exc, "stderr", "") or exc
        raise SystemExit(
            "拼音转写失败（这个脚本的自动补全只能在 macOS 上跑）：\n"
            f"  {str(detail).strip()}\n"
            "  标题不多的话，也可以手动写 {#ying-wen}，--check 只检查不转写。"
        )
    return proc.stdout.rstrip("\n").split("\n")


def iter_heading_lines(lines: list[str]):
    """遍历正文里的标题，跳过 front matter 和围栏代码块。

    产出 (行号, kind, hashes, body, closing)：
      ATX    `## 标题 ##`   → kind="atx"，hashes="##"，body="标题"，closing=" ##"
      Setext `标题` + `----` → kind="setext"，hashes=""，body="标题"
    这个博客里两种写法都有（越早的文章越爱用下划线式标题）。
    """
    start = 0
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() in ("---", "..."):
                start = i + 1
                break

    fence = None
    skip_next = None
    for i in range(start, len(lines)):
        line = lines[i]
        m = FENCE.match(line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence):
                fence = None
            continue
        if m:
            fence = m.group(1)
            continue
        if i == skip_next:
            continue
        hm = HEADING.match(line)
        if hm:
            yield i, "atx", hm.group(1), hm.group(2), None
            continue
        # 下划线式标题：本行是标题文字，下一行是 ---- 或 ====
        if line.strip() and i + 1 < len(lines) and SETEXT.match(lines[i + 1]):
            underline = SETEXT.match(lines[i + 1]).group(1)
            if underline.startswith("=") or len(underline) >= 2:
                yield i, "setext", "", line.rstrip(), None
                skip_next = i + 1


def split_closing(text: str) -> tuple[str, str]:
    """拆出 `标题 ##` 这种收尾的井号，补属性时不能写到它后面。"""
    m = re.match(r"^(.*?)[ \t]+(#+)[ \t]*$", text)
    if m:
        return m.group(1), " " + m.group(2)
    return text, ""


def auto_id(text: str) -> str:
    """近似 Hugo 的自动 id（github 风格），只用来判断会不会撞车。"""
    text = strip_markup(text).lower()
    text = re.sub(r"[^\w\u3005\u3007\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff -]", "", text)
    return text.strip().replace(" ", "-")


def scan_file(path: Path):
    lines = path.read_text(encoding="utf-8").split("\n")
    used: set[str] = set()
    todo = []  # (行号, kind, hashes, 原文, 收尾井号)
    heading_texts = []
    duplicates = []

    for i, kind, hashes, text, _closing in iter_heading_lines(lines):
        if kind == "atx":
            body, closing = split_closing(text)
        else:
            body, closing = text, ""
        explicit = EXPLICIT_ID.search(body)
        if explicit:
            if explicit.group(1) in used:
                duplicates.append((i + 1, explicit.group(1)))
            used.add(explicit.group(1))
            continue
        used.add(auto_id(body))
        if CJK.search(body):
            todo.append((i, kind, hashes, body, closing))
            heading_texts.append(strip_markup(body))

    return lines, todo, heading_texts, used, duplicates


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="只打印，不改文件")
    parser.add_argument("--check", action="store_true", help="只检查，缺锚点就退出码 1")
    args = parser.parse_args()

    files = sorted(CONTENT.rglob("*.md"))
    plans = []          # 要写的文件： (path, lines, [(行号, 新行)])
    needs: list[str] = []

    for path in files:
        lines, todo, texts, used, duplicates = scan_file(path)
        for lineno, slug in duplicates:
            rel = path.relative_to(ROOT)
            print(f"{rel}:{lineno}: 同一个文件里 {slug} 这个锚点用了两次", file=sys.stderr)
        if not todo:
            continue
        needs.extend(texts)
        rel = path.relative_to(ROOT)
        edits = []
        for (lineno, kind, hashes, body, closing), text in zip(todo, texts):
            edits.append((lineno, kind, hashes, body, closing, text, rel))
        plans.append((path, lines, edits))

    if args.check:
        if not plans:
            print(f"锚点检查通过：{len(files)} 个文件里的中文标题都带了 {{#...}} 显式锚点")
            return 0
        print("下面这些中文标题还没写显式锚点，链接里会变成 %e4%b9%a0%e6%83%af 这种：", file=sys.stderr)
        for path, _lines, edits in plans:
            rel = path.relative_to(ROOT)
            for lineno, *_rest in edits:
                print(f"  {rel}:{lineno + 1}", file=sys.stderr)
        print(
            "  → 在 macOS 上跑 python3 scripts/add-heading-anchors.py 自动补齐，"
            "或手写 {#ying-wen}（比如 ## 习惯 {#habit}）",
            file=sys.stderr,
        )
        return 1

    if not plans:
        print(f"没有需要补锚点的中文标题（扫了 {len(files)} 个文件）")
        return 0

    slugs = pinyin_slugs(needs)
    if len(slugs) != len(needs):
        raise SystemExit(f"拼音转写结果数量对不上：{len(needs)} → {len(slugs)}")

    cursor = 0
    total = 0
    for path, lines, edits in plans:
        rel = path.relative_to(ROOT)
        # 同一个文件内去重，避免两个标题拿到同一个 id
        _lines, todo, _texts, used, _dups = scan_file(path)
        for lineno, kind, hashes, body, closing, text, _rel in edits:
            slug = slugify(slugs[cursor])
            cursor += 1
            if not slug:
                print(f"  跳过（转写后没有可用字符）：{rel}:{lineno + 1} {body}", file=sys.stderr)
                continue
            base, n = slug, 1
            while slug in used:
                n += 1
                slug = f"{base}-{n}"
            used.add(slug)
            if kind == "atx":
                lines[lineno] = f"{hashes} {body} {{#{slug}}}{closing}"
            else:
                lines[lineno] = f"{body} {{#{slug}}}"
            print(f"{rel}:{lineno + 1}  {body}  →  {slug}")
            total += 1
        if not args.dry_run:
            path.write_text("\n".join(lines), encoding="utf-8")

    verb = "会补" if args.dry_run else "已补"
    print(f"{verb} {total} 个标题的锚点（{len(plans)} 个文件）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
