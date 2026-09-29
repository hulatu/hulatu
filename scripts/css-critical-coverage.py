#!/usr/bin/env python3
"""严格版首屏覆盖检查：判据是「页面里**真正内联**的那段 CSS 有没有这条规则」。

用法:
  python3 scripts/css-critical-coverage.py public/index.html
  python3 scripts/css-critical-coverage.py public/index.html --all

为什么不能读 assets/css/critical.css 源文件：
  critical 已按页型拆成 4 个文件（critical / critical-post / critical-page /
  critical-info），首页不内联 critical-post、文章页不内联 critical-info。
  「这一页到底内联了哪几个」只有构建产物知道，所以直接读页面里的 <style>。

三个会给出假「全绿」的坑（前两版都栽过）：
  ① 必须排除 @media print 块 —— 打印重置列表里那一长串 .site-footer, .back-top,
     .post-rail … 会让选择器「看起来有规则」，实际对屏幕首屏毫无作用。
  ② 比对要认选择器边界 —— 直接 substring 会让 .post 命中 .post-content。
  ③ 别读源文件 —— 拆分之后源文件不等于页面实际内联的东西（v2 就是这么误报的）。
"""
import re
import sys
import pathlib
from html.parser import HTMLParser


def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def drop_print(s):
    """删掉所有 @media print { ... } 块（含 @media print and (...) 形式）。"""
    out, i = [], 0
    while True:
        m = re.search(r'@media\s+print[^{]*\{', s[i:])
        if not m:
            out.append(s[i:])
            break
        out.append(s[i:i + m.start()])
        j = i + m.end()
        depth = 1
        while j < len(s) and depth:
            if s[j] == '{':
                depth += 1
            elif s[j] == '}':
                depth -= 1
            j += 1
        i = j
    return ''.join(out)


def clean(s):
    return drop_print(strip_comments(s))


def has(css, sel):
    """css 里有没有针对 sel 的规则（认选择器边界）。"""
    return re.search(re.escape(sel) + r'(?![\w-])', css) is not None


def style_rules(css):
    """产出所有样式规则的选择器串（递归进 @media / @supports，跳过 @keyframes 内部）。"""
    i, n, start = 0, len(css), 0
    while i < n:
        ch = css[i]
        if ch == '{':
            prelude = css[start:i].strip()
            depth, j = 1, i + 1
            while j < n and depth:
                if css[j] == '{':
                    depth += 1
                elif css[j] == '}':
                    depth -= 1
                j += 1
            if prelude.startswith('@'):
                if prelude.startswith(('@media', '@supports')):
                    yield from style_rules(css[i + 1:j - 1])
            else:
                yield prelude
            i, start = j, j
        elif ch == '}':
            i += 1
            start = i
        else:
            i += 1


class Page(HTMLParser):
    """收集页面用到的 class/id，并抓出内联 <style> 与外部样式表链接。"""

    def __init__(self):
        super().__init__()
        self.sel = set()
        self.head = []
        self.inline = []
        self.links = []
        self._in_style = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'style':
            self._in_style = True
        if tag == 'link' and d.get('rel') == 'stylesheet' and d.get('href'):
            self.links.append(d['href'])
        for k, v in attrs:
            if k == 'class' and v:
                for c in v.split():
                    self.sel.add('.' + c)
                    if len(self.head) < 60:
                        self.head.append('.' + c)
            elif k == 'id' and v:
                self.sel.add('#' + v)

    def handle_endtag(self, tag):
        if tag == 'style':
            self._in_style = False

    def handle_data(self, data):
        if self._in_style:
            self.inline.append(data)


def main():
    page = sys.argv[1]
    show_all = '--all' in sys.argv
    p = pathlib.Path(page)
    raw = p.read_text(encoding='utf-8')

    pg = Page()
    pg.feed(raw)
    crit = clean(''.join(pg.inline))

    # 异步包：按 <link href> 从构建产物里找同名文件。
    # href 是**根相对**的（/css/xxx.css），不能拿页面自己的父目录去找 ——
    # 嵌套页面（/tags/ai/index.html）会找不到，于是把真缺口误判成「纯 JS 钩子」。
    root = p.parent
    while root != root.parent and not (root / 'css').is_dir():
        root = root.parent
    async_css = {}
    for href in pg.links:
        cand = root / href.lstrip('/')
        if cand.is_file():
            async_css[href.split('/')[-1][:44]] = clean(cand.read_text(encoding='utf-8'))

    missing = sorted(s for s in pg.sel if not has(crit, s))
    head = set(pg.head)

    real, hooks = [], []
    for s in missing:
        where = [n for n, c in async_css.items() if has(c, s)]
        (real if where else hooks).append((s, where))

    print(f'{page}')
    print(f'  内联关键 CSS {len(crit)}B（{len(pg.inline)} 段 <style>）；异步包 {len(async_css)} 个')
    print(f'  页面用到 {len(pg.sel)} 个 class/id；内联里没有规则的 {len(missing)} 个')
    print(f'  —— 真缺口（规则只在异步包里）{len(real)} 个：')
    for s, where in real:
        print(f'       {s:<24} 落在 {where}{" ★首屏" if s in head else ""}')

    # —— 盲区提醒：异步包里那些**不带 class/id** 的选择器 ——
    # 上面整套核对是「按 class/id 逐个对」，所以 a[target="_blank"]::after 这种
    # 裸元素 / 属性选择器完全不在它的覆盖范围内。2026-09-29 就是这么漏掉外链 ↗ 的：
    # 友链页首屏缺了箭头、整行文字宽度跳一次，最后靠逐像素比对才发现。
    # 这里只做提醒，不自动判定 —— 是不是首屏要用，得人看一眼。
    bare = sorted({
        (part.strip(), name)
        for name, css in async_css.items()
        for sel in style_rules(css)
        for part in sel.split(',')
        if part.strip() and not re.search(r'[.#]', part)
    })
    if bare:
        print(f'  —— ⚠ 异步包里的裸元素 / 属性选择器 {len(bare)} 条'
              f'（本检查按 class 核对，覆盖不到，需人工判断是否首屏要用）:')
        for sel, name in bare:
            print(f'       {sel:<44} 落在 {name}')
    if show_all and hooks:
        print(f'  —— 纯 JS 钩子 / 跳转锚点（哪都没有样式）{len(hooks)} 个：')
        print('       ' + ' '.join(s for s, _ in hooks))


main()
