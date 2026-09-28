#!/usr/bin/env python3
"""给这次改动过的文章刷新 front matter 里的 `lastmod`，让文章页能显示「更新于」。

为什么需要它：文章页的「更新于」只在 `lastmod` 晚于 `date` 时才出现
（见 layouts/_default/single.html），而 Hugo 的 `.Lastmod` 在 front matter 里没写
lastmod 时会退回用 `date`——所以「改了文章、忘改 lastmod」的结果就是永远不显示。
这里在发布前把**这次真正改动过**的文件的 lastmod 刷成当前时间，写文章时不用记着改。

「真正改动过」怎么判断：把当前文件和上一个提交（HEAD）里的版本，都去掉 `lastmod:` 那一行
之后再比较。相同就跳过——这样 publish.sh 反复跑也不会一直刷新（第一次刷完 lastmod 后，
第二次比较时两边都被去掉，仍然相同）。HEAD 里没有的新文件也跳过：它们刚写出来，
lastmod 和 date 本来就是一回事，不需要「更新于」。

默认只处理 content/posts/ 和 content/weekly/ 下的文章——只有文章页会显示「更新于」，
改「关于」「隐私政策」这类页面时没必要动它的 lastmod（那些页面的 lastmod 只影响 sitemap）。
要处理别的文件，直接把它当参数传进来（配合 --force）。

用法：
  python3 scripts/sync-lastmod.py                # 刷新 content/ 下这次改动过的 .md
  python3 scripts/sync-lastmod.py --dry-run      # 只打印会刷哪些，不写文件
  python3 scripts/sync-lastmod.py --force 某篇.md  # 指定文件强制刷新（内容没动也刷）
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import _frontmatter


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"

# 站点里所有 front matter 日期都是 +08:00，这里固定用同一个时区，免得换机器发布时格式不一致
TZ = timezone(timedelta(hours=8))


def git_lines(*args: str) -> list[str]:
    """跑 git，返回路径列表。

    统一用 `-z`：中文文件名在默认设置下会被转义成 "content/posts/\\347\\240..." 这种
    形式，拿到手根本拼不回真实路径，而 -z 输出的是原样、以 NUL 分隔的路径。
    （`-z` 要放在 `--` 前面，否则会被当成路径。）
    """
    subcommand, *rest = args
    result = subprocess.run(
        ["git", subcommand, "-z", *rest],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return [line for line in result.stdout.split("\0") if line.strip()]


def changed_content_files() -> list[Path]:
    """这次发布里改动过的**文章**（含未提交的改动和新增文件）。

    只看 content/posts 和 content/weekly：其余页面（关于 / 隐私政策 / 友链 …）不显示
    「更新于」，没必要跟着刷新 lastmod，否则每次改页面都会多出一堆无意义的 diff。
    """
    names = set(git_lines("diff", "--name-only", "HEAD", "--", "content"))
    names.update(
        git_lines("ls-files", "--others", "--exclude-standard", "--", "content")
    )
    articles = [
        name
        for name in names
        if name.startswith("content/posts/") or name.startswith("content/weekly/")
    ]
    return sorted(CONTENT.parent / name for name in articles)


def head_text(rel_path: str) -> str | None:
    """上一个提交里这个文件的内容；新文件（HEAD 里没有）返回 None。"""
    result = subprocess.run(
        ["git", "show", f"HEAD:{rel_path}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout if result.returncode == 0 else None


def without_lastmod(text: str) -> str:
    """去掉 front matter 里的 lastmod 行（比较「有没有实质改动」时用）。"""
    return _frontmatter.remove(text, "lastmod")


def with_lastmod(text: str, stamp: str) -> tuple[str, bool]:
    """把 front matter 里的 lastmod 换成 stamp；没有这个字段就补在 date 后面。"""
    return _frontmatter.write(text, "lastmod", stamp, after="date")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="发布前刷新改动过文章的 front matter lastmod"
    )
    parser.add_argument("files", nargs="*", help="指定文件；不给就取 git 里改动过的 content/ 文件")
    parser.add_argument("--dry-run", action="store_true", help="只打印会刷哪些，不改文件")
    parser.add_argument("--force", action="store_true", help="指定文件时忽略「内容没实质改动」直接刷")
    args = parser.parse_args()

    stamp = datetime.now(TZ).strftime("%Y-%m-%dT%H:%M:%S+08:00")

    if args.files:
        targets = []
        for name in args.files:
            path = Path(name)
            targets.append(path if path.is_absolute() else (Path.cwd() / path))
    else:
        targets = changed_content_files()

    touched: list[Path] = []
    skipped: list[str] = []

    for path in targets:
        if path.suffix != ".md" or path.name == "_index.md":
            continue
        if not path.is_file():
            skipped.append(f"{path}（文件不存在）")
            continue

        try:
            rel_path = path.resolve().relative_to(ROOT).as_posix()
        except ValueError:
            skipped.append(f"{path}（不在仓库里）")
            continue

        text = path.read_text(encoding="utf-8")
        if not args.force:
            previous = head_text(rel_path)
            if previous is None:
                skipped.append(f"{rel_path}（新文件）")
                continue
            if without_lastmod(previous) == without_lastmod(text):
                skipped.append(f"{rel_path}（内容没实质改动）")
                continue

        updated, changed = with_lastmod(text, stamp)
        if not changed:
            reason = (
                "没有 front matter"
                if _frontmatter.split(text) is None
                else "lastmod 已经是这个时间"
            )
            skipped.append(f"{rel_path}（{reason}）")
            continue

        if args.dry_run:
            print(f"    会刷新 lastmod：{rel_path}")
        else:
            path.write_text(updated, encoding="utf-8")
            print(f"    已刷新 lastmod：{rel_path} → {stamp}")
        touched.append(path)

    if not touched:
        print("    没有需要刷新 lastmod 的文章")
    if skipped and (args.files or args.force or args.dry_run):
        for item in skipped:
            print(f"    跳过：{item}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # 发布流程里失败不阻断，但要让调用方知道
        print(f"sync-lastmod 出错：{exc}", file=sys.stderr)
        sys.exit(1)
