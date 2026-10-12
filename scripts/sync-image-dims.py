#!/usr/bin/env python3
"""扫描 content/ 里所有图片 URL，抓回它们的**像素尺寸**，写成 data/image-dims.json。

为什么需要这个文件
──────────────────
本站图片全部托管在图床（img.hulatu.com），Hugo 在构建期**拿不到**它们的尺寸。
而站点层 `layouts/_default/_markup/render-image.html` 要给每个 <img> 输出
width/height（用来预留版面、消除图片晚到时的 CLS），所以尺寸必须在**构建前**
就已经知道。

这里选择「**离线抓一次、把结果提交进仓库**」而不是 Hugo 的 resources.GetRemote：
  · 构建保持**零网络依赖** —— 图床挂了 / 断网也照样能构建（这是本站的架构底线）
  · 构建可复现、速度快
  · 与 data/runs.json 的既有做法一致

代价：**新加图片后要重跑一次本脚本**，否则那张图没有 width/height
（模板里有兜底：查不到就照旧不输出这两个属性，不会报错、也不会破版）。
`scripts/check-image-dims.py` 可以查出「漏了哪几张」。

用法
────
    python3 scripts/sync-image-dims.py            # 只补缺的
    python3 scripts/sync-image-dims.py --all      # 全部重抓
    python3 scripts/sync-image-dims.py --check    # 只报告缺哪些，不联网
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
OUT = ROOT / "data" / "image-dims.json"

# Markdown 图片语法：![alt](url)  以及可选的 title
MD_IMG = re.compile(r"!\[[^\]]*\]\(\s*(?P<url>[^)\s]+)")
# Hugo 的 shortcode 里也可能写图片（本仓目前没有，留个兜底）
HTML_IMG = re.compile(r"""<img[^>]+src=["']?(?P<url>https?://[^"'\s>]+)""")

UA = {"User-Agent": "hulatu-blog-dim-fetcher/1.0"}


# ── 各种格式的尺寸解析（只吃头部字节，不需要整张图）────────────────────
def _jpeg(b: bytes):
    i = 2
    while i < len(b) - 9:
        if b[i] != 0xFF:
            i += 1
            continue
        m = b[i + 1]
        if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", b[i + 5:i + 9])
            return w, h
        if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
            i += 2
            continue
        if i + 4 > len(b):
            break
        ln = struct.unpack(">H", b[i + 2:i + 4])[0]
        i += 2 + ln
    return None


def _png(b: bytes):
    if b[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", b[16:24])
    return w, h


def _gif(b: bytes):
    if b[:3] != b"GIF":
        return None
    w, h = struct.unpack("<HH", b[6:10])
    return w, h


def _webp(b: bytes):
    if b[:4] != b"RIFF" or b[8:12] != b"WEBP":
        return None
    fourcc = b[12:16]
    if fourcc == b"VP8 ":
        # 关键帧起始码 9d 01 2a 之后是宽高（各 14 bit）
        i = b.find(b"\x9d\x01\x2a")
        if i < 0:
            return None
        w, h = struct.unpack("<HH", b[i + 3:i + 7])
        return w & 0x3FFF, h & 0x3FFF
    if fourcc == b"VP8L":
        bits = struct.unpack("<I", b[21:25])[0]
        w = (bits & 0x3FFF) + 1
        h = ((bits >> 14) & 0x3FFF) + 1
        return w, h
    if fourcc == b"VP8X":
        w = int.from_bytes(b[24:27], "little") + 1
        h = int.from_bytes(b[27:30], "little") + 1
        return w, h
    return None


def _ascii_url(url: str) -> str:
    """把 URL 里非 ASCII 的部分百分号编码。

    ⚠️ 本站图床的文件名里有**中文**（`鸡蛋beSQLQ.webp`、`张雪峰漫画封面生成SsZtRO.webp`），
    而 HTTP 请求行只能装 latin-1，不编码会直接抛 UnicodeEncodeError。
    已经编码过的 `%20` 要保留（不能再编成 `%2520`），所以只对非 ASCII 字符动手。
    """
    return urllib.parse.quote(url, safe=":/?#[]@!$&'()*+,;=%~")


def parse_dimensions(b: bytes):
    """按 **magic 先判格式**，再用对应解析器。

    ⚠️ 不能「依次试每个解析器、谁先返回用谁」—— `_jpeg` 是从第 2 字节开始扫
    `FF C0` 这类 SOF 标记的，在**非 JPEG 的字节流里也会误命中**。
    实测踩过：一张 3776×1866 的 GIF 被 JPEG 扫描器读成 47342×30211。
    """
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return _png(b)
    if b[:2] == b"\xff\xd8":
        return _jpeg(b)
    if b[:3] == b"GIF":
        return _gif(b)
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return _webp(b)
    return None


def probe_dimensions(url: str, want: int = 262144, timeout: int = 30):
    """只下载前 want 字节（够解析头部即可），返回 ((w, h), None) 或 (None, 错误串)。

    ⚠️ 图床会限流：连着打几十个请求就会开始回 `SSL: UNEXPECTED_EOF_WHILE_READING`
    （不是格式问题，是连接被掐）。所以这里**带指数退避重试**，并在调用侧加间隔。
    """
    last = None
    for attempt in range(4):
        if attempt:
            time.sleep(1.5 * (2 ** (attempt - 1)))     # 1.5s / 3s / 6s
        req = urllib.request.Request(_ascii_url(url),
                                     headers={**UA, "Range": f"bytes=0-{want - 1}"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                b = r.read(want)
        except Exception as e:                          # noqa: BLE001
            last = f"{type(e).__name__}: {e}"
            continue
        got = parse_dimensions(b)
        if got:
            return got, None
        return None, f"无法识别的格式（magic={b[:12]!r}）"
    return None, last


def collect_urls() -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for f in sorted(CONTENT.rglob("*.md")):
        text = f.read_text(encoding="utf-8", errors="replace")
        for m in list(MD_IMG.finditer(text)) + list(HTML_IMG.finditer(text)):
            u = m.group("url")
            if u.startswith("//"):
                u = "https:" + u
            if not u.startswith("http"):
                continue
            if u not in seen:
                seen.add(u)
                urls.append(u)
    return urls


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="全部重抓（默认只补缺的）")
    ap.add_argument("--check", action="store_true", help="只报告缺失，不联网")
    args = ap.parse_args()

    urls = collect_urls()
    old: dict[str, list[int]] = {}
    if OUT.exists():
        old = json.loads(OUT.read_text(encoding="utf-8"))

    missing = [u for u in urls if u not in old]
    print(f"content/ 里共 {len(urls)} 个唯一图片 URL；已记录 {len(old)} 个；缺 {len(missing)} 个")

    if args.check:
        for u in missing:
            print("  缺:", u)
        stale = [u for u in old if u not in set(urls)]
        for u in stale:
            print("  仓库里已不再引用:", u)
        return 1 if (missing or stale) else 0

    todo = urls if args.all else missing
    if not todo:
        print("没有需要抓的。")
        return 0

    ok = fail = 0
    for n, u in enumerate(todo, 1):
        if n > 1:
            time.sleep(0.25)                      # 节流：别把图床打限流
        dim, err = probe_dimensions(u)
        if dim:
            old[u] = list(dim)
            ok += 1
            print(f"  [{n}/{len(todo)}] {dim[0]}x{dim[1]}  {u}")
        else:
            fail += 1
            print(f"  [{n}/{len(todo)}] ✗ {err}  {u}")

    # 排序输出，diff 才稳定
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({k: old[k] for k in sorted(old)}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"\n写入 {OUT.relative_to(ROOT)}：{len(old)} 条（本次成功 {ok} / 失败 {fail}）")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
