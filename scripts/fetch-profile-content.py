#!/usr/bin/env python3
"""生成 profile.hulatu.com 需要的动态内容快照。

目前生成：
- sites/profile/data/latest_posts.json：主站最新文章
- sites/profile/data/selected_photos.json：shot.hulatu.com 精选瞬间

用法：
    python3 scripts/fetch-profile-content.py
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CONTENT_ROOT = ROOT / "content"
SHOT_CONTENT_ROOT = ROOT / "sites" / "shot" / "content" / "shots"
PROFILE_DATA = ROOT / "sites" / "profile" / "data"


def _front_matter(text: str) -> tuple[dict, str]:
    if not text.startswith("---\n"):
        return {}, text
    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not match:
        return {}, text
    fm_text, body = match.groups()
    fm: dict = {}
    for key in ("title", "date", "slug", "draft"):
        m = re.search(rf"^{key}:\s*[\"']?(.*?)[\"']?\s*$", fm_text, re.M)
        if m:
            fm[key] = m.group(1).strip()
    return fm, body


def _clean_summary(text: str, limit: int = 88) -> str:
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[#>*_`~-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > limit:
        text = text[:limit].rstrip() + "…"
    return text


def _slugify(slug: str) -> str:
    """把 slug 规范成与 Hugo 实际输出一致的小写形式。

    Hugo 默认 disablePathToLower=false，会把 URL 路径小写化、空格转连字符、
    移除非字母数字的标点，并折叠连续连字符。这里尽量对齐同一规则，
    避免 front matter 里写了大写或不规范 slug 时生成出 404 的链接。
    """
    out: list[str] = []
    for ch in slug.lower():
        if ch.isspace():
            out.append("-")
        elif ch in "-._~" or unicodedata.category(ch)[0] in ("L", "N"):
            out.append(ch)
        # 其余（标点、符号等）直接丢弃，与 Hugo 行为一致
    return re.sub(r"-+", "-", "".join(out)).strip("-")


def _article_item(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    fm, body = _front_matter(text)
    if not fm.get("title") or not fm.get("date"):
        return None
    if fm.get("draft", "").lower() == "true":
        return None
    date = fm["date"][:10]
    slug = _slugify(fm.get("slug") or path.stem)
    parts = date.split("-")
    if len(parts) != 3:
        return None
    url = f"https://hulatu.com/posts/{parts[0]}/{parts[1]}/{parts[2]}/{slug}/"
    return {
        "title": fm["title"],
        "date": date,
        "url": url,
        "summary": _clean_summary(body),
    }


def _shot_item(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    fm, _ = _front_matter(text)
    if not fm.get("title") or not fm.get("date") or not fm.get("image"):
        return None
    if fm.get("draft", "").lower() == "true":
        return None
    date = fm["date"][:10]
    parts = date.split("-")
    if len(parts) != 3:
        return None
    slug = _slugify(fm.get("slug") or path.stem)
    return {
        "title": fm["title"],
        "image": fm["image"],
        "date": date,
        "url": f"https://shot.hulatu.com/{parts[0]}/{parts[1]}/{slug}/",
    }


def main() -> None:
    posts: list[dict] = []
    for path in CONTENT_ROOT.rglob("*.md"):
        if path.name == "_index.md":
            continue
        rel = path.relative_to(CONTENT_ROOT)
        if rel.parts[0] not in {"posts", "weekly"}:
            continue
        item = _article_item(path)
        if item:
            posts.append(item)
    posts.sort(key=lambda x: (x["date"], x["title"]), reverse=True)

    shots: list[dict] = []
    if SHOT_CONTENT_ROOT.exists():
        for path in SHOT_CONTENT_ROOT.glob("*.md"):
            item = _shot_item(path)
            if item:
                shots.append(item)
    shots.sort(key=lambda x: (x["date"], x["title"]), reverse=True)

    PROFILE_DATA.mkdir(parents=True, exist_ok=True)
    (PROFILE_DATA / "latest_posts.json").write_text(
        json.dumps({"posts": posts[:5]}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (PROFILE_DATA / "selected_photos.json").write_text(
        json.dumps({"photos": shots[:4]}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"生成 profile 快照：最新文章 {len(posts[:5])} 篇，精选瞬间 {len(shots[:4])} 张")


if __name__ == "__main__":
    main()
