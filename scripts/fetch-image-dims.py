#!/usr/bin/env python3
"""抓取正文里所有远程图片的像素尺寸，写入 data/image_dims.json。

用法：
    python3 scripts/fetch-image-dims.py          # 只补新增图片
    python3 scripts/fetch-image-dims.py --force   # 全部重新抓取

为什么需要它：
    正文图片是远程图床（img.hulatu.com）的地址，Hugo 构建期拿不到它们的宽高。
    模板渲染 <img> 时如果没有 width/height，浏览器就不知道图片占多大地方，
    等图片加载完页面会往下跳一下（布局偏移）。这个脚本把尺寸缓存成数据文件，
    模板查表输出宽高，页面就不会跳了。

实现说明：
    通过 Cloudflare Image Transformations 取一份 width=1200 的 JPEG 变体
    （固定 format=jpeg，避免拿到不好解析的 AVIF），只读它的头部拿宽高。
    fit=scale-down 会保持原始比例，所以这个比例和页面上真正加载的图一致。
    没有第三方依赖，只用标准库。
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
OUT_FILE = ROOT / "data" / "image_dims.json"

CDN_HOST = "https://img.hulatu.com/"
TRANSFORM = "cdn-cgi/image/format=jpeg,width=1200,fit=scale-down,metadata=none/"

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) hugo-blog-dims-fetcher"
TIMEOUT = 30
WORKERS = 12

# 行内图片：![alt](url)
RE_INLINE = re.compile(r"!\[[^\]]*\]\(\s*(https?://[^\s)]+)")
# 引用式图片的定义行：[id]: url
RE_REFDEF = re.compile(r"^\s*\[[^\]]+\]:\s*(https?://\S+)", re.MULTILINE)


def collect_urls() -> list[str]:
    urls: set[str] = set()
    for md in CONTENT_DIR.rglob("*.md"):
        try:
            text = md.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        urls.update(RE_INLINE.findall(text))
        urls.update(RE_REFDEF.findall(text))
    return sorted(urls)


def jpeg_dims(data: bytes) -> tuple[int, int] | None:
    i, n = 2, len(data)
    while i < n - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        if marker == 0xDA:  # 进入压缩数据，后面不再有 SOF
            return None
        seg_len = int.from_bytes(data[i + 2 : i + 4], "big")
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            h = int.from_bytes(data[i + 5 : i + 7], "big")
            w = int.from_bytes(data[i + 7 : i + 9], "big")
            return (w, h) if w and h else None
        i += 2 + seg_len
    return None


def png_dims(data: bytes) -> tuple[int, int] | None:
    if len(data) < 24:
        return None
    w = int.from_bytes(data[16:20], "big")
    h = int.from_bytes(data[20:24], "big")
    return (w, h) if w and h else None


def gif_dims(data: bytes) -> tuple[int, int] | None:
    if len(data) < 10:
        return None
    w = int.from_bytes(data[6:8], "little")
    h = int.from_bytes(data[8:10], "little")
    return (w, h) if w and h else None


def webp_dims(data: bytes) -> tuple[int, int] | None:
    pos = 12
    n = len(data)
    while pos + 8 <= n:
        fourcc = data[pos : pos + 4]
        size = int.from_bytes(data[pos + 4 : pos + 8], "little")
        body = data[pos + 8 : pos + 8 + size]
        if fourcc == b"VP8X" and len(body) >= 10:
            w = int.from_bytes(body[4:7], "little") + 1
            h = int.from_bytes(body[7:10], "little") + 1
            return (w, h)
        if fourcc == b"VP8 " and len(body) >= 10:
            w = int.from_bytes(body[6:8], "little") & 0x3FFF
            h = int.from_bytes(body[8:10], "little") & 0x3FFF
            return (w, h) if w and h else None
        if fourcc == b"VP8L" and len(body) >= 5 and body[0] == 0x2F:
            bits = int.from_bytes(body[1:5], "little")
            w = (bits & 0x3FFF) + 1
            h = ((bits >> 14) & 0x3FFF) + 1
            return (w, h)
        pos += 8 + size + (size & 1)
    return None


def parse_dims(data: bytes) -> tuple[int, int] | None:
    if data[:2] == b"\xff\xd8":
        return jpeg_dims(data)
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return png_dims(data)
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return gif_dims(data)
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return webp_dims(data)
    return None


def to_transform_url(url: str) -> str:
    """把图床原图地址换成「固定 JPEG + 宽度 1200」的转换地址。"""
    if url.startswith(CDN_HOST):
        return CDN_HOST + TRANSFORM + url[len(CDN_HOST) :]
    return url


def encode_url(url: str) -> str:
    """把路径里的非 ASCII 字符（中文文件名等）转成百分号编码。

    已有的 %XX 转义要保留，所以把 % 也放进 safe 里，避免二次编码。
    """
    parts = urlsplit(url)
    if not parts.scheme:
        return url
    path = quote(parts.path, safe="/%:@!$&'()*+,;=~-._")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def fetch_dims(url: str) -> tuple[str, tuple[int, int] | None, str | None]:
    request = urllib.request.Request(
        encode_url(to_transform_url(url)),
        headers={"User-Agent": USER_AGENT, "Accept": "image/jpeg,image/*;q=0.8"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            data = response.read()
    except Exception as exc:  # 单张失败不影响整批
        return url, None, str(exc)
    dims = parse_dims(data)
    if dims is None:
        return url, None, "无法解析图片尺寸"
    return url, dims, None


def main() -> int:
    force = "--force" in sys.argv[1:]

    existing: dict[str, list[int]] = {}
    if OUT_FILE.exists() and not force:
        try:
            existing = json.loads(OUT_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            existing = {}

    urls = collect_urls()
    todo = [u for u in urls if u not in existing]

    print(f"正文远程图片共 {len(urls)} 张，已缓存 {len(urls) - len(todo)} 张，待抓取 {len(todo)} 张")

    def save() -> None:
        result = {u: existing[u] for u in sorted(urls) if u in existing}
        OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUT_FILE.write_text(
            json.dumps(result, ensure_ascii=False, indent=0, sort_keys=True) + "\n",
            encoding="utf-8",
        )

    if todo:
        failed: list[tuple[str, str]] = []
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            for i, (url, dims, error) in enumerate(pool.map(fetch_dims, todo), 1):
                if dims:
                    existing[url] = [dims[0], dims[1]]
                else:
                    failed.append((url, error or "未知错误"))
                if i % 25 == 0 or i == len(todo):
                    print(f"  进度 {i}/{len(todo)}")
                if i % 50 == 0:
                    save()  # 中途落盘，万一中断也不用从头再来
        if failed:
            print(f"\n有 {len(failed)} 张失败（已跳过，可稍后重跑）：", file=sys.stderr)
            for url, error in failed[:10]:
                print(f"  {url} — {error}", file=sys.stderr)

    # 只保留仍被引用的条目，并按 URL 排序，让 git diff 干净
    result = {url: existing[url] for url in sorted(urls) if url in existing}
    save()
    print(f"已写入 {OUT_FILE.relative_to(ROOT)}（{len(result)} 条）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
