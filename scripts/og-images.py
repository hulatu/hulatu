#!/usr/bin/env python3
"""为每篇文章生成 1200x630 的 OG 分享图。

用法：python3 scripts/og-images.py <构建输出目录>
在 deploy.sh 中于 hugo 构建后、rsync 前调用。
"""

import glob
import os
import re
import shutil
import subprocess
import sys


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
BG = "#f6f6f8"
INK = "#1d1d1f"
MUTED = "#6e6e73"
RED = "#c73e2f"
W, H = 1200, 630


def parse_front(path):
    """解析 front matter，返回 dict。仅支持本仓库的实际写法。"""
    raw = open(path, encoding="utf-8").read()
    if not raw.startswith("---"):
        return None
    parts = raw.split("---", 2)
    if len(parts) < 3:
        return None
    fm, body = parts[1], parts[2]

    def field(name):
        m = re.search(r"^%s\s*:\s*(.*)$" % name, fm, re.M)
        if not m:
            return None
        val = m.group(1).strip()
        if val.startswith('"') and val.endswith('"'):
            return val[1:-1]
        if val.startswith("'") and val.endswith("'"):
            return val[1:-1]
        return val

    title = field("title") or os.path.splitext(os.path.basename(path))[0]
    slug = field("slug")
    date_raw = field("date") or ""
    date_str = date_raw.strip()[:10] or "2000-01-01"
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        date_str = "2000-01-01"
    draft = bool(re.search(r"^draft\s*:\s*true\s*$", fm, re.M))

    cat = ""
    m = re.search(r"^categories\s*:\s*\[(.*?)\]", fm, re.M | re.S)
    if m:
        cats = re.findall(r'"([^"]+)"|\'([^\']+)\'', m.group(1))
        cats = [a or b for a, b in cats]
        if cats:
            cat = cats[0]

    text = re.sub(r"\s+", "", body)
    chars = len(text)
    return {
        "title": title,
        "slug": slug,
        "date": date_str,
        "cat": cat,
        "draft": draft,
        "chars": chars,
        "mins": (chars + 299) // 300,
        "path": path,
    }


def wrap_title(title, limit=13):
    lines = []
    cur = ""
    for ch in title:
        if len(cur) >= limit:
            lines.append(cur)
            cur = ""
        cur += ch
    if cur:
        lines.append(cur)
    if len(lines) > 3:
        lines = lines[:3]
        lines[2] = lines[2][:-1] + "…"
    return lines


def render(post, out_path, logo_resized):
    lines = wrap_title(post["title"])
    if len(lines) == 1:
        tsize, ty0, gap = 76, 210, 96
    elif len(lines) == 2:
        tsize, ty0, gap = 64, 220, 86
    else:
        tsize, ty0, gap = 54, 215, 74

    meta = "{} · {}".format(post["date"], "{} 字".format(post["chars"]))
    if post["cat"]:
        meta = "{} · {}".format(meta, post["cat"])
    meta += " · 约 {} 分钟".format(post["mins"])

    args = [
        "magick",
        "-size",
        "{}x{}".format(W, H),
        "xc:" + BG,
        logo_resized,
        "-gravity",
        "northwest",
        "-geometry",
        "+64+46",
        "-composite",
        "-font",
        FONT,
        "-fill",
        MUTED,
        "-pointsize",
        "26",
        "-annotate",
        "+152+88",
        "胡拉图说",
        "-annotate",
        "+{}+88".format(W - 64 - 170),
        "hulatu.com",
        "-fill",
        INK,
        "-pointsize",
        str(tsize),
    ]
    for i, line in enumerate(lines):
        args += ["-annotate", "+64+{}".format(ty0 + i * gap), line]
    args += [
        "-stroke",
        "none",
        "-fill",
        RED,
        "-draw",
        "rectangle 64,526 82,544",
        "-fill",
        MUTED,
        "-pointsize",
        "27",
        "-annotate",
        "+98+544",
        meta,
        out_path,
    ]
    subprocess.run(args, check=True)


def main():
    if len(sys.argv) != 2:
        print("用法：python3 scripts/og-images.py <构建输出目录>", file=sys.stderr)
        return 1
    if not shutil.which("magick"):
        print("未找到 magick（ImageMagick），跳过 OG 图生成。", file=sys.stderr)
        return 0
    stage = os.path.abspath(sys.argv[1])
    out_dir = os.path.join(stage, "og")
    os.makedirs(out_dir, exist_ok=True)

    logo_resized = os.path.join(stage, "og", ".logo-64.png")
    subprocess.run(
        [
            "magick",
            os.path.join(ROOT, "static", "logo.png"),
            "-resize",
            "64x64",
            logo_resized,
        ],
        check=True,
    )

    posts = []
    for f in glob.glob(os.path.join(ROOT, "content", "posts", "*.md")):
        posts.append(f)
    for f in glob.glob(os.path.join(ROOT, "content", "weekly", "*.md")):
        posts.append(f)

    n_ok = n_skip = 0
    for f in posts:
        post = parse_front(f)
        if not post or post["draft"] or not post["slug"]:
            continue
        key = "{}-{}".format(post["date"].replace("-", ""), post["slug"])
        out_path = os.path.join(out_dir, key + ".png")
        if os.path.exists(out_path) and os.path.getmtime(out_path) >= os.path.getmtime(f):
            n_skip += 1
            continue
        try:
            render(post, out_path, logo_resized)
            n_ok += 1
        except subprocess.CalledProcessError:
            print("生成失败：{}".format(os.path.basename(f)), file=sys.stderr)
    print("OG 图：新增 {} 张，跳过 {} 张".format(n_ok, n_skip))
    os.remove(logo_resized)
    return 0


if __name__ == "__main__":
    sys.exit(main())
