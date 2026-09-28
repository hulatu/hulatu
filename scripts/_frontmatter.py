#!/usr/bin/env python3
"""content/ 下 YAML front matter 的最小公共实现。

为什么要有这个文件：`fetch-profile-content.py`（读 title / date / slug / draft）和
`sync-lastmod.py`（改 lastmod）以前各写了一份 front matter 正则，连「哪一段算
front matter」「行尾怎么处理」都略有出入。收拢成一份，两边都从这里取。

为什么不用 PyYAML 之类的库：这些脚本必须**原样保留** front matter 的排版——
里面有中文注释、对齐用的行尾空格、空行。用 yaml 解析再 dump 回去，注释和空行
会全部消失，git diff 会变成一整块重写。所以这里只做「按行找字段」这一件事。
"""

from __future__ import annotations

import re
from collections.abc import Iterable

# front matter 是文件开头那两个 `---` 之间的部分；正文里出现的 `key: value`
# 不算（所有操作都限制在第一段里）。
FRONT_MATTER = re.compile(r"^---\r?\n(.*?)\r?\n---[ \t]*\r?\n", re.S)


def split(text: str) -> tuple[str, str] | None:
    """切成 (front matter, 正文)；没有 front matter 时返回 None。"""
    match = FRONT_MATTER.match(text)
    if not match:
        return None
    return match.group(1), text[match.end():]


def _line_pattern(key: str) -> re.Pattern[str]:
    return re.compile(rf"^{re.escape(key)}:[ \t]*.*$", re.M)


def fields(text: str, keys: Iterable[str]) -> dict[str, str]:
    """按需读几个顶层字段（值去掉包裹的引号）；读不到的字段不出现在结果里。"""
    parts = split(text)
    if not parts:
        return {}
    out: dict[str, str] = {}
    for key in keys:
        match = re.search(rf"^{re.escape(key)}:[ \t]*(.*?)[ \t]*$", parts[0], re.M)
        if not match:
            continue
        value = match.group(1).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if value:
            out[key] = value
    return out


def read(text: str, key: str) -> str | None:
    """读一个顶层字段的值（去掉包裹的引号）；字段不存在返回 None。"""
    return fields(text, (key,)).get(key)


def remove(text: str, key: str) -> str:
    """删掉字段所在的那一行（用于「先把它去掉再比较」这种判断）。"""
    parts = split(text)
    if not parts:
        return text
    match = FRONT_MATTER.match(text)
    stripped = _line_pattern(key).sub("", parts[0])
    return text[: match.start(1)] + stripped + text[match.end(1):]


def write(text: str, key: str, value: str, after: str = "date") -> tuple[str, bool]:
    """把字段写成 `key: value`：已存在就替换那一行，不存在就插在 `after` 字段后面。

    返回 (新内容, 是否真的改了)。字段名和内容都原样保留，只动这一行。
    """
    match = FRONT_MATTER.match(text)
    if not match:
        return text, False
    front_matter = match.group(1)
    line = _line_pattern(key)
    if line.search(front_matter):
        updated = line.sub(f"{key}: {value}", front_matter, count=1)
    else:
        anchor = re.search(rf"^{re.escape(after)}:[ \t]*.*$", front_matter, re.M)
        if not anchor:
            return text, False
        updated = (
            front_matter[: anchor.end()]
            + f"\n{key}: {value}"
            + front_matter[anchor.end():]
        )
    if updated == front_matter:
        return text, False
    return text[: match.start(1)] + updated + text[match.end(1):], True
