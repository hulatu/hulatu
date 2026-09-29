#!/usr/bin/env python3
"""给这次改动过的文章刷新 front matter 里的 `lastmod`，让文章页能显示「更新于」。

为什么需要它：文章页的「更新于」只在 `lastmod` 晚于 `date` 时才出现
（见 layouts/_default/single.html），而 Hugo 的 `.Lastmod` 在 front matter 里没写
lastmod 时会退回用 `date`——所以「改了文章、忘改 lastmod」的结果就是永远不显示。
这里在发布前把**这次真正改动过**的文件的 lastmod 刷成当前时间，写文章时不用记着改。

「真正改动过」怎么判断：把当前文件和上一个提交（HEAD）里的版本，都去掉 `lastmod:` 那一行、
再抹平「无关紧要的空白」之后比较（见 content_fingerprint 的说明）。相同就跳过——这样
publish.sh 反复跑也不会一直刷新（第一次刷完 lastmod 后，第二次比较时两边都被去掉，仍然相同）。
HEAD 里没有的新文件也跳过：它们刚写出来，lastmod 和 date 本来就是一回事，不需要「更新于」。

为什么还要单独抹平空白：编辑器或清理脚本收拾行尾空格时，git 会把整批文件标成「已修改」，
但内容一个字没变。只按字符串比较的话，这些文章的 lastmod 会被集体刷成发布时刻
（2026-09-29 那次行尾空白清理一次就是 106 篇），文章页的「更新于」跟着集体往前跳，
git 里还多出上百行无意义的 diff。

默认只处理 content/posts/ 和 content/weekly/ 下的文章——只有文章页会显示「更新于」，
改「关于」「隐私政策」这类页面时没必要动它的 lastmod（那些页面的 lastmod 只影响 sitemap）。
要处理别的文件，直接把它当参数传进来（配合 --force）。

用法：
  python3 scripts/sync-lastmod.py                # 刷新 content/ 下这次改动过的 .md
  python3 scripts/sync-lastmod.py --dry-run      # 只打印会刷哪些，不写文件
  python3 scripts/sync-lastmod.py --force 某篇.md  # 指定文件强制刷新（内容没动、或只改了行尾硬换行时用）
"""

from __future__ import annotations

import argparse
import re
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


# 换行符只认这三种。不用 str.splitlines()：它还会在 \x0b \x0c \x85 \u2028 \u2029 这些
# 「看起来不像换行」的字符上断行，Markdown 正文里万一出现就会被悄悄拆成两行。
LINE_BREAK = re.compile(r"\r\n|\r|\n")


def without_lastmod(text: str) -> str:
    """去掉 front matter 里的 lastmod 行（判断「有没有改动」时用）。"""
    return _frontmatter.remove(text, "lastmod")


def content_fingerprint(text: str) -> str:
    """在 without_lastmod 的基础上再抹平「无关紧要的空白」，用来判断有没有**实质**改动。

    为什么必须抹平空白：2026-09-29 那次清理 front matter 行尾空格的提交（d154d53）
    一共动了 113 个文件，其中 106 个只差行尾空格 —— 内容一个字没变。脚本原先只做
    字符串相等判断，会把这 106 篇的 lastmod 全刷成发布时刻：git 里多出上百行无意义的
    diff，文章页的「更新于」也集体往前跳到发布那天。所以比较前先抹平这三类空白：

      1. 行尾空白 —— 就是上面那个例子的来源（`draft: false  ` → `draft: false`）；
      2. 换行符 —— CRLF / CR 统一成 LF（跨平台编辑器的换行符不一致也算「没改」）；
      3. 文件末尾多出来的空行。

    刻意**不**抹平行首缩进和行内空格：Markdown 里行首缩进会改变语义（4 空格 = 代码块、
    2 空格 = 嵌套列表），行内空格就是正文本身，这些都是真改动，不能被当成「没实质改动」
    而漏刷 lastmod。

    已知取舍：Markdown 里「行尾两个空格 = 硬换行 <br>」也会被一起忽略。它和「误留的行尾
    空格」在文本上完全无法区分，只能偏向「不动 lastmod」这一边；真遇到只加了硬换行的
    改动，用 `--force 某篇.md` 手动刷一次即可。
    """
    # 先把换行符统一成 LF 再交给 _frontmatter：它的正则只认 \r?\n，纯 \r 的旧式换行
    # 会让它连 front matter 都找不到，lastmod 那一行就删不掉，两边指纹自然对不上。
    body = without_lastmod(LINE_BREAK.sub("\n", text))
    lines = [line.rstrip() for line in body.split("\n")]
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


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
    whitespace_only: list[str] = []

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
            # 走到这里说明字符串确实不同，但可能只差行尾空白（编辑器清理的）。
            # 这种情况内容一个字没变，不该刷 lastmod —— 只记下来，不算「这次改过」。
            if content_fingerprint(previous) == content_fingerprint(text):
                whitespace_only.append(rel_path)
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
    if whitespace_only:
        # 这些文件在 git status 里显示「已修改」，但内容一个字没变（只差行尾空白）。
        # 明说一句，免得看到一堆改动却没有任何 lastmod 更新时以为脚本没干活。
        print(
            f"    跳过 {len(whitespace_only)} 篇只差空白字符的改动"
            "（内容没变，lastmod 不动）"
        )
        if args.files or args.force or args.dry_run:
            for rel_path in whitespace_only:
                print(f"      只差空白：{rel_path}")
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
