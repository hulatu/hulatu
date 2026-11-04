#!/usr/bin/env python3
"""维护 data/pinyin.json —— 标题锚点用的「汉字 → 拼音」字典。

── 这个脚本为什么不改 md 了 ────────────────────────────────────────────
2026-09-26 的老脚本（add-heading-anchors.py）是往每篇文章的标题后面**写死**
`## 习惯 {#xi-guan}`，一共刷了 560 处、99 个文件。写文章时满屏噪音，
改一个标题还得回去改锚点。

2026-11-04 起改成**构建期计算**：
  · md 里只写 `## 习惯`
  · 拼音由 layouts/partials/heading-slug.html 在构建时算出来
  · 算拼音要一张字表 → 就是本脚本维护的 data/pinyin.json
所以本脚本**只动那一个 JSON**，一个 md 文件都不碰。

── 为什么要单独存一张表 ────────────────────────────────────────────────
拼音转写用的是 macOS 自带的 Foundation（NSStringTransformToLatin），
**Linux 上没有**。而 Cloudflare Pages 的构建机是 Linux —— 构建时转不了拼音。
所以只能在本机把结果落进 JSON 提交上去，云端直接查表。

── 用法 ────────────────────────────────────────────────────────────────
  python3 scripts/sync-pinyin.py            # 补齐缺字（需要 macOS）
  python3 scripts/sync-pinyin.py --dry-run  # 只打印会补哪些字
  python3 scripts/sync-pinyin.py --check    # 只检查：缺字就退出码 1

── 缺字会发生什么 ──────────────────────────────────────────────────────
heading-slug.html 遇到字典里没有的汉字会**整条回退**成中文锚点
（`#%E4%B9%A0%E6%83%AF` 这种），不会算出半截拼音。
所以缺字不会让站点坏掉，只是那一节的链接变丑 —— `--check` 就是用来提前发现它的。
⚠️ 新增文章用了生僻字，记得跑一次本脚本再提交。
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
DICT = ROOT / "data" / "pinyin.json"

HEADING = re.compile(r"^(#{1,6})[ \t]+(.*)$")
FENCE = re.compile(r"^[ \t]*(`{3,}|~{3,})")
SETEXT = re.compile(r"^[ \t]*(=+|-{2,})[ \t]*$")
# 与 heading-slug.html 的 `\p{Han}` 保持同一套范围（含兼容区与扩展 A）。
HAN = re.compile(r"[\u3005\u3007\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")

# 拼音转写交给 macOS 的 Foundation：NSStringTransformToLatin 按词给带声调的拼音，
# 去掉声调就是 xi guan 这种可读形式（多音字走系统词典，比自建字表靠谱）。
JXA = r"""
function run(argv) {
  ObjC.import("Foundation");
  var out = [];
  for (var i = 0; i < argv.length; i++) {
    var s = $.NSMutableString.alloc.initWithString(argv[i]);
    var latin = s.stringByApplyingTransformReverse($.NSStringTransformToLatin, false);
    var plain = latin.stringByApplyingTransformReverse($.NSStringTransformStripDiacritics, false);
    out.push(ObjC.unwrap(plain) + "");
  }
  return out.join("\n");
}
"""


def iter_heading_texts(path: Path):
    """遍历一个 md 文件里的标题文字，跳过 front matter 与围栏代码块。

    两种写法都要覆盖：`## 标题`（ATX）和「标题 + ----」（Setext）。
    本站早期文章大量使用下划线式标题，漏掉它们会算漏一批汉字。
    """
    lines = path.read_text(encoding="utf-8").split("\n")
    start = 0
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() in ("---", "..."):
                start = i + 1
                break

    fence = None
    skip_next = False
    for i in range(start, len(lines)):
        line = lines[i]
        if skip_next:
            skip_next = False
            continue
        m = FENCE.match(line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence):
                fence = None
            continue
        if m:
            fence = m.group(1)
            continue
        hm = HEADING.match(line)
        if hm:
            yield hm.group(2)
            continue
        if line.strip() and i + 1 < len(lines):
            sm = SETEXT.match(lines[i + 1])
            if sm and (sm.group(1).startswith("=") or len(sm.group(1)) >= 2):
                yield line.rstrip()
                skip_next = True


def collect_chars():
    """全站标题里出现过的汉字，按「字 → 出现的标题数」计数。"""
    counts: dict[str, int] = {}
    files = sorted(CONTENT.rglob("*.md"))
    for path in files:
        for text in iter_heading_texts(path):
            for ch in HAN.findall(text):
                counts[ch] = counts.get(ch, 0) + 1
    return counts, len(files)


def transliterate(chars: list[str]) -> dict[str, str]:
    payload = chars
    try:
        proc = subprocess.run(
            ["osascript", "-l", "JavaScript", "-e", JXA, *payload],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        detail = getattr(exc, "stderr", "") or exc
        raise SystemExit(
            "拼音转写失败（补字只能在 macOS 上跑）：\n"
            f"  {str(detail).strip()}\n"
            "  换机器时把 data/pinyin.json 一起提交过去就行 —— 云端构建只查表、不转写。"
        )
    out = proc.stdout.rstrip("\n").split("\n")
    if len(out) != len(chars):
        raise SystemExit(f"转写结果数量对不上：{len(chars)} → {len(out)}")
    result = {}
    for ch, raw in zip(chars, out):
        slug = raw.strip().lower()
        slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
        if not slug:
            raise SystemExit(f"「{ch}」转写结果为空，需要手工指定读音")
        result[ch] = slug
    return result


def write_dict(data: dict[str, str]) -> None:
    keys = sorted(data)
    lines = ["{"] + [
        f'  {json.dumps(k, ensure_ascii=False)}: {json.dumps(data[k], ensure_ascii=False)},'
        for k in keys
    ] + ["}"]
    text = "\n".join(lines).replace(",\n}", "\n}") + "\n"
    DICT.write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="只打印，不写文件")
    parser.add_argument("--check", action="store_true", help="只检查，缺字就退出码 1")
    args = parser.parse_args()

    data = json.loads(DICT.read_text(encoding="utf-8")) if DICT.exists() else {}
    counts, nfiles = collect_chars()
    missing = sorted(ch for ch in counts if ch not in data)

    if args.check:
        if not missing:
            print(
                f"拼音字典完整：{len(data)} 条，覆盖 {nfiles} 个文件标题里的全部 "
                f"{len(counts)} 个汉字"
            )
            return 0
        print(
            f"data/pinyin.json 缺 {len(missing)} 个汉字，"
            "用到它们的标题会回退成中文锚点（#%E4... 这种）：",
            file=sys.stderr,
        )
        for ch in missing:
            print(f"  {ch}  （出现在 {counts[ch]} 个标题里）", file=sys.stderr)
        print("  → 在 macOS 上跑 python3 scripts/sync-pinyin.py 补齐", file=sys.stderr)
        return 1

    if not missing:
        print(f"拼音字典已是最新：{len(data)} 条，覆盖 {len(counts)} 个汉字（{nfiles} 个文件）")
        return 0

    print(f"缺 {len(missing)} 个汉字：{''.join(missing)}")
    if args.dry_run:
        print("（--dry-run，不写文件）")
        return 0

    data.update(transliterate(missing))
    write_dict(data)
    print(f"已写入 {DICT.relative_to(ROOT)}：{len(data)} 条")
    return 0


if __name__ == "__main__":
    sys.exit(main())
