#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把豆瓣「看过 / 读过 / 听过」的书影音数据同步进 data/media.json。

    cd ~/Blog && env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
      /Users/hulatu/.workbuddy-ai/binaries/python/envs/default/bin/python \
      scripts/sync-douban.py

  豆瓣 ID 写在 hugo.toml 的 `params.doubanId`（写一次以后就不用带参数了）；
  也可以用 `--uid <你的豆瓣ID>` 临时指定。

  ⚠️ 必须摘掉代理环境变量。沙箱里设了 HTTP_PROXY/HTTPS_PROXY，
     那个代理不放行 douban.com，会得到一堆莫名其妙的超时。

设计要点（踩过的坑都写在对应位置，别照直觉改）：

  · 豆瓣**没有可用的官方 API**。Frodo（frodo.douban.com/api/v2）需要 apikey，
    实测流传的几个 key 全部返回 invalid_apikey，别去试了。所以走网页抓取。
  · 抓的是公开的收藏页，**不需要登录 cookie**（前提：豆瓣主页的收藏是公开的）。
  · `Referer` 头是硬要求，尤其是 book.douban.com —— 不带 Referer 直接 403，
    带上任何 douban.com 的 Referer 就 200。**不是**「要带查询参数」，
    这个误判浪费过时间（那次测试恰好也带了 Referer）。
  · 封面有防盗链：同一张图，无 Referer → 418，本站 Referer → 403，
    只有豆瓣自家 Referer → 200。所以封面必须带 Referer 下载到本地，
    不能外链、也不能靠 referrerpolicy="no-referrer" 绕。
  · 请求要慢。豆瓣对机房/高频 IP 有限流习惯，脚本默认每次请求间隔 1.2 秒，
    并且对 403/5xx 做指数退避重试。

输出：
  data/media.json                   —— 数据（模板读 hugo.Data.media）
  static/images/media/<kind>-<id>.webp —— 封面，400px 宽（卡片最大 ~200 CSS px，够 2x）

  已存在的封面会跳过下载（增量）。想强制重下加 --force-covers。
"""

from __future__ import annotations

import argparse
import html
import io
import json
import os
import re
import sys
import time
import urllib.parse
from datetime import datetime, timezone, timedelta

import requests

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

# ---------------------------------------------------------------- 常量

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

# 每个站点的基址。Referer 用同域首页，实测三个站都认。
SITES = {
    "movie": "https://movie.douban.com",
    "book": "https://book.douban.com",
    "music": "https://music.douban.com",
}

# 收藏状态。collect = 看过/读过/听过，wish = 想看，do = 在看。
# 当前只用 collect —— 用户要的是「全部看过」，想看/在看不算「记录」。
STATUS = "collect"

# 影视条目里「国家/地区」字段的取值集合。用来在 intro 的一长串
# 「日期 / 演员 / 国家 / 导演 / 片长 / 类型 / 编剧 / 语言」里定位国家，
# 从而拿到它后面的导演。**这个表要维护** —— 遇到没收录的国家会退回 None
# （卡片少一行「导演」而已，不会出错），脚本会把这些条目标出来。
COUNTRIES = {
    "中国大陆", "中国香港", "中国台湾", "中国澳门", "美国", "日本", "韩国", "英国",
    "法国", "德国", "意大利", "西班牙", "葡萄牙", "俄罗斯", "苏联", "加拿大",
    "澳大利亚", "新西兰", "印度", "泰国", "新加坡", "马来西亚", "越南", "菲律宾",
    "印度尼西亚", "印尼", "巴西", "阿根廷", "墨西哥", "智利", "瑞典", "丹麦",
    "挪威", "芬兰", "冰岛", "荷兰", "比利时", "波兰", "捷克", "匈牙利", "奥地利",
    "瑞士", "爱尔兰", "希腊", "土耳其", "以色列", "伊朗", "埃及", "南非", "尼日利亚",
    "乌克兰", "罗马尼亚", "保加利亚", "克罗地亚", "塞尔维亚", "斯洛文尼亚", "斯洛伐克",
    "立陶宛", "拉脱维亚", "爱沙尼亚", "哥伦比亚", "秘鲁", "乌拉圭", "古巴", "委内瑞拉",
    "沙特阿拉伯", "阿联酋", "卡塔尔", "巴基斯坦", "孟加拉国", "斯里兰卡", "尼泊尔",
    "缅甸", "柬埔寨", "老挝", "蒙古", "哈萨克斯坦", "卢森堡", "摩纳哥", "马耳他",
    "白俄罗斯", "格鲁吉亚", "亚美尼亚", "阿塞拜疆", "摩尔多瓦", "阿尔巴尼亚",
    "波黑", "北马其顿", "黑山", "塞浦路斯", "约旦", "黎巴嫩", "叙利亚", "伊拉克",
    "阿富汗", "肯尼亚", "摩洛哥", "突尼斯", "阿尔及利亚", "加纳", "埃塞俄比亚",
    "科特迪瓦", "塞内加尔", "喀麦隆", "安哥拉", "莫桑比克", "坦桑尼亚", "乌干达",
    "津巴布韦", "赞比亚", "多米尼加", "危地马拉", "哥斯达黎加", "巴拿马", "厄瓜多尔",
    "玻利维亚", "巴拉圭", "波多黎各", "牙买加", "海地", "萨尔瓦多", "洪都拉斯",
    "尼加拉瓜", "巴哈马", "特立尼达和多巴哥", "巴勒斯坦", "科威特", "巴林", "阿曼",
    "也门", "利比亚", "苏丹", "索马里", "厄立特里亚", "卢旺达", "布隆迪", "马拉维",
    "博茨瓦纳", "纳米比亚", "莱索托", "斯威士兰", "马达加斯加", "毛里求斯", "塞舌尔",
    "佛得角", "几内亚", "马里", "布基纳法索", "尼日尔", "乍得", "中非", "加蓬",
    "刚果", "刚果民主共和国", "贝宁", "多哥", "利比里亚", "塞拉利昂", "冈比亚",
    "毛里塔尼亚", "西撒哈拉", "安道尔", "列支敦士登", "圣马力诺", "梵蒂冈", "不丹",
    "马尔代夫", "文莱", "东帝汶", "巴布亚新几内亚", "斐济", "萨摩亚", "汤加",
    "瓦努阿图", "所罗门群岛", "密克罗尼西亚", "帕劳", "马绍尔群岛", "瑙鲁", "图瓦卢",
    "基里巴斯", "纽埃", "库克群岛", "法罗群岛", "格陵兰", "百慕大", "开曼群岛",
    "英属维尔京群岛", "美属维尔京群岛", "关岛", "塞班岛", "波内佩", "复活节岛",
}

# 一个字段长得像 URL 就跳过（影视 intro 里导演前面常夹着一个官网地址，
# 例如 `... / 美国 / www.hbo.com/game-of-thrones / 杰雷米·波德斯瓦 / ...`）。
URL_RE = re.compile(r"^(www\.|https?://)|^[\w.-]+\.(com|net|org|jp|cn|kr|tv|io|co|me|info|fr|de|uk|ru)(/|$)", re.I)


# ---------------------------------------------------------------- 抓取

class Fetcher:
    """带限速与退避重试的抓取器。所有请求都从这里走，方便统一控制节奏。"""

    def __init__(self, delay: float = 1.2, retries: int = 3, verbose: bool = True):
        self.delay = delay
        self.retries = retries
        self.verbose = verbose
        self.session = requests.Session()
        self.last = 0.0

    def _throttle(self):
        gap = time.time() - self.last
        if gap < self.delay:
            time.sleep(self.delay - gap)
        self.last = time.time()

    def get(self, url: str, referer: str, *, binary: bool = False):
        """返回 (bytes|None, status)。404 是正常结果（没有这一页），不重试。"""
        for attempt in range(self.retries):
            self._throttle()
            try:
                r = self.session.get(
                    url,
                    headers={
                        "User-Agent": UA,
                        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                        "Referer": referer,
                        **({"Accept": "image/avif,image/webp,image/*,*/*;q=0.8"} if binary else {}),
                    },
                    timeout=25,
                )
            except requests.RequestException as e:
                if self.verbose:
                    print(f"      网络异常（第 {attempt + 1} 次）：{e}", file=sys.stderr)
                time.sleep(2 ** attempt)
                continue

            if r.status_code == 200:
                return (r.content if binary else r.text), 200
            if r.status_code == 404:
                return None, 404
            # 403 多半是 Referer 不对或被限流，退避后重试
            if self.verbose:
                print(f"      HTTP {r.status_code}（第 {attempt + 1} 次）：{url[:80]}", file=sys.stderr)
            time.sleep(3 * (attempt + 1))

        return None, 0


# ---------------------------------------------------------------- 解析

def clean(s: str) -> str:
    """去标签、解实体、压空白。"""
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def parse_rating(block: str):
    """`<span class="rating5-t">` → 5.0；`rating45-t` → 4.5。

    豆瓣用「数字+可选的 5」表示半星：rating5-t = 5 星，rating45-t = 4.5 星，
    rating3-t = 3 星。没评分的条目这个 span 根本不存在。"""
    m = re.search(r'<span class="rating(\d+)', block)
    if not m:
        return None
    raw = m.group(1)
    if len(raw) == 2 and raw.endswith("5"):
        return float(raw[0]) + 0.5
    return float(raw)


def parse_year_from_intro(parts, prefer_index=None):
    """从 intro 的分段里捞年份。影视取第一个日期字段，音乐/书籍另有约定。"""
    if prefer_index is not None and prefer_index < len(parts):
        m = re.search(r"(\d{4})", parts[prefer_index])
        if m:
            return m.group(1)
    for p in parts:
        m = re.match(r"(\d{4})(?:-\d{1,2})?(?:-\d{1,2})?", p)
        if m:
            return m.group(1)
    return None


def pick_director(parts):
    """从影视 intro 的分段里定位导演。

    结构是「上映日期… / 演员… / 国家[ / 国家] / [官网] / 导演… / 片长 / 类型…」，
    演员个数不定，所以不能靠下标。做法：先找第一个「裸国家字段」，
    再往后跳过国家与 URL，第一个剩下的就是导演。

    找不到就返回 None —— 卡片少一行而已，不会出错。"""
    start = None
    for i, p in enumerate(parts):
        if p in COUNTRIES:
            start = i
            break
    if start is None:
        return None
    for p in parts[start + 1:]:
        if p in COUNTRIES or URL_RE.match(p):
            continue
        if re.search(r"\d", p):  # 带数字的多半是片长/年份/集数，不是人名
            return None
        if 1 < len(p) <= 40:
            return p
        return None
    return None


def parse_movie_like(block: str, kind: str, subject_id: str):
    """影视与音乐共用同一套 DOM（div.item.comment-item）。

    区别只在 intro 的分段含义：
      影视：日期 / 演员… / 国家 / [官网] / 导演… / 片长 / 类型 / 编剧 / 语言
      音乐：表演者 / 发行时间 / 专辑类型 / 介质 / 流派
    """
    title_m = re.search(r'<li class="title">\s*<a[^>]*>\s*<em>(.*?)</em>', block, re.S)
    intro_m = re.search(r'<li class="intro">(.*?)</li>', block, re.S)
    date_m = re.search(r'<span class="date">(.*?)</span>', block, re.S)
    comment_m = re.search(r'<span class="comment">(.*?)</span>', block, re.S)
    cover_m = re.search(r'<img\s+alt="[^"]*"\s+src="([^"]+)"', block)
    if not cover_m:
        cover_m = re.search(r'<img[^>]+src="([^"]+)"', block)

    title = clean(title_m.group(1)) if title_m else ""
    parts = [clean(p) for p in clean(intro_m.group(1)).split(" / ")] if intro_m else []
    parts = [p for p in parts if p]

    if kind == "movie":
        creator = pick_director(parts)
        year = parse_year_from_intro(parts)
    else:  # music：第一段是表演者，第二段是发行时间
        creator = parts[0] if parts else None
        year = parse_year_from_intro(parts, prefer_index=1)

    return {
        "kind": kind,
        "id": subject_id,
        "title": title,
        "creator": creator,
        "year": year,
        "rating": parse_rating(block),
        "date": clean(date_m.group(1)) if date_m else None,
        "comment": clean(comment_m.group(1)) if comment_m else None,
        "link": f"{SITES[kind]}/subject/{subject_id}/",
        "cover_src": cover_m.group(1) if cover_m else None,
    }


def parse_book(block: str, subject_id: str):
    """读书页的 DOM 和另外两个站不一样：li.subject-item，标题在 h2 > a[title]。

    副标题藏在标题链接里的一个 <span>，要剥掉（title 属性里没有它，用 title 更干净）。"""
    title_m = re.search(r'<h2>\s*<a[^>]*title="([^"]*)"', block, re.S)
    if not title_m:
        title_m = re.search(r"<h2>\s*<a[^>]*title='([^']*)'", block, re.S)
    pub_m = re.search(r'<div class="pub">(.*?)</div>', block, re.S)
    date_m = re.search(r'<span class="date">(.*?)</span>', block, re.S)
    comment_m = re.search(r'<p class="comment[^"]*"[^>]*>(.*?)</p>', block, re.S)
    cover_m = re.search(r'<img\s+src="([^"]+)"', block)

    parts = [clean(p) for p in clean(pub_m.group(1)).split(" / ")] if pub_m else []
    parts = [p for p in parts if p]

    # .pub 的约定是「作者 / 出版社 / 出版年 / 定价」。作者可能不止一位，
    # 但按豆瓣的写法都挤在第一段里，直接取第一段。
    creator = parts[0] if parts else None
    year = None
    for p in parts:
        m = re.match(r"(\d{4})", p)
        if m:
            year = m.group(1)
            break

    # 日期里带着「读过」两个字，剥掉
    date = clean(date_m.group(1)) if date_m else None
    if date:
        date = re.sub(r"(读过|在读|想读)\s*$", "", date).strip()

    return {
        "kind": "book",
        "id": subject_id,
        "title": clean(title_m.group(1)) if title_m else "",
        "creator": creator,
        "year": year,
        "rating": parse_rating(block),
        "date": date,
        "comment": clean(comment_m.group(1)) if comment_m else None,
        "link": f"https://book.douban.com/subject/{subject_id}/",
        "cover_src": cover_m.group(1) if cover_m else None,
    }


def split_items(page: str, kind: str):
    """把一个收藏页切成条目块。两个站的容器名不同，别写死一个。"""
    if kind == "book":
        parts = re.split(r'<li class="subject-item"', page)[1:]
        return [(p, p) for p in parts]
    parts = re.split(r'<div class="item comment-item"', page)[1:]
    return [(p, p) for p in parts]


def subject_id_of(block: str) -> str:
    """从条目块里抠出豆瓣条目 ID。链接是 .../subject/<id>/，封面文件名里也有。"""
    m = re.search(r"/subject/(\d+)", block)
    if m:
        return m.group(1)
    m = re.search(r'data-cid="(\d+)"', block)
    return m.group(1) if m else ""


def parse_page(page: str, kind: str):
    out = []
    for block, _ in split_items(page, kind):
        sid = subject_id_of(block)
        if not sid:
            continue
        if kind == "book":
            item = parse_book(block, sid)
        else:
            item = parse_movie_like(block, kind, sid)
        if item["title"]:
            out.append(item)
    return out


def total_of(page: str):
    """从 <title>「阿北看过的影视(218)」里读总数，用来算要翻几页。"""
    m = re.search(r"<title>(.*?)</title>", page, re.S)
    if not m:
        return None
    m2 = re.search(r"[（(](\d+)[）)]", m.group(1))
    return int(m2.group(1)) if m2 else None


# ---------------------------------------------------------------- 封面

def upgrade_cover_url(src: str) -> str:
    """把豆瓣的缩略图地址换成中档图。

    collect 页给的是 270px 宽的小图（`/s/`、`/s_ratio_poster/`），而卡片在 2x 屏
    要 400px —— 直接把 270 拉到 400 会糊。换档位实测：
      · /view/photo/s_ratio_poster/ → /view/photo/m_ratio_poster/   270×378 → 540×756
      · /view/subject/s/            → /view/subject/m/              270×40x → 332/408×500

    **只换到 m 档，不换 l**：l 档是 1080px、单张 445KB，200 张就是 ~90MB 流量，
    而我们最后反正要缩到 400 —— 多下的那 80% 全是白费。

    换档位偶尔会 404（图太老、或该档位没生成），所以调用方必须能退回原地址。"""
    u = src.replace("/view/photo/s_ratio_poster/", "/view/photo/m_ratio_poster/")
    u = u.replace("/view/subject/s/", "/view/subject/m/")
    return u


def fetch_cover(f: Fetcher, item, cover_dir: str, force: bool) -> str | None:
    """下载封面 → 转 webp → 存 static/images/media/。返回站内路径（/images/media/…）。

    ⚠️ 必须带豆瓣 Referer，否则 418/403（防盗链）。"""
    src = item.get("cover_src")
    if not src:
        return None

    name = f"{item['kind']}-{item['id']}.webp"
    dest = os.path.join(cover_dir, name)
    rel = f"/images/media/{name}"

    if os.path.exists(dest) and not force:
        return rel

    ref = SITES[item["kind"]] + "/"
    data, status = f.get(upgrade_cover_url(src), referer=ref, binary=True)
    if not data:
        # 换档位失败就退回 collect 页给的原地址（小一号，总比没有强）
        data, status = f.get(src, referer=ref, binary=True)
    if not data:
        print(f"      ⚠️ 封面失败（HTTP {status}）：{item['title']}", file=sys.stderr)
        return None

    if Image is None:
        # 没有 Pillow 就原样落盘（扩展名会是 .webp 但内容是 jpg —— 不理想，
        # 所以这里直接报错退出更诚实）
        raise RuntimeError("需要 Pillow 才能转 webp：pip install Pillow")

    try:
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGB")
        # 卡片最大约 200 CSS px 宽，2x 屏 = 400。等比缩到 400 宽。
        if im.width > 400:
            h = round(im.height * 400 / im.width)
            im = im.resize((400, h), Image.LANCZOS)
        os.makedirs(cover_dir, exist_ok=True)
        im.save(dest, "WEBP", quality=82, method=5)
    except Exception as e:
        print(f"      ⚠️ 封面处理失败（{item['title']}）：{e}", file=sys.stderr)
        return None

    return rel


# ---------------------------------------------------------------- 主流程

def crawl(f: Fetcher, uid: str, kind: str, limit: int | None):
    """翻完一个站的全部收藏页。每页 15 条。"""
    base = f"{SITES[kind]}/people/{urllib.parse.quote(uid)}/{STATUS}"
    ref = SITES[kind] + "/"

    items, start, total = [], 0, None
    while True:
        url = f"{base}?start={start}&sort=time&rating=all&filter=all&mode=grid"
        page, status = f.get(url, referer=ref)
        if not page:
            if status == 404:
                print(f"    {kind}: 没有这一页（start={start}），收工")
            else:
                print(f"    {kind}: start={start} 抓取失败（HTTP {status}）", file=sys.stderr)
            break

        if total is None:
            total = total_of(page)
            print(f"    {kind}: 主页显示共 {total if total is not None else '?'} 条")

        got = parse_page(page, kind)
        if not got:
            print(f"    {kind}: start={start} 解析出 0 条，停（页面结构可能变了）")
            break
        items.extend(got)

        if limit and len(items) >= limit:
            items = items[:limit]
            break
        if total is not None and len(items) >= total:
            break
        if len(got) < 15:  # 最后一页
            break
        start += 15

    return items


def resolve_uid(cli_uid: str | None) -> str:
    """豆瓣 ID 从哪来：命令行 --uid 优先，否则读 hugo.toml 的 params.doubanId。

    放 hugo.toml 而不是脚本里写死：那是站点的「身份」配置（author / email 都在那儿），
    而且模板将来若要链到豆瓣主页也能直接取 site.Params.doubanId，不用再抄一遍。

    用 tomllib（Python 3.11+ 标准库）而不是正则 —— 正则读 TOML 会在注释、
    多行字符串、引号转义上翻车，而 hugo.toml 里恰好到处是中文注释。"""
    if cli_uid:
        return cli_uid.strip()

    import tomllib

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cfg = os.path.join(root, "hugo.toml")
    if not os.path.exists(cfg):
        sys.exit("找不到 hugo.toml，也没有传 --uid。")

    with open(cfg, "rb") as fp:
        data = tomllib.load(fp)
    uid = (data.get("params", {}) or {}).get("doubanId", "")
    if not uid:
        sys.exit(
            "没有豆瓣 ID。两种给法：\n"
            "  1) 命令行：--uid <你的豆瓣ID>\n"
            "  2) 写进 hugo.toml 的 params.doubanId（推荐，写一次以后就不用带了）\n"
            "ID 在个人主页 URL 里：https://www.douban.com/people/<这一段>/"
        )
    return uid.strip()


def main():
    ap = argparse.ArgumentParser(description="同步豆瓣书影音到 data/media.json")
    ap.add_argument("--uid", default=None,
                    help="豆瓣 ID。不传则读 hugo.toml 的 params.doubanId")
    ap.add_argument("--kinds", default="movie,book,music", help="要抓的类型，逗号分隔")
    ap.add_argument("--out", default="data/media.json", help="输出 JSON 路径")
    ap.add_argument("--cover-dir", default="static/images/media", help="封面输出目录")
    ap.add_argument("--limit", type=int, default=None, help="每类最多抓多少条（调试用）")
    ap.add_argument("--delay", type=float, default=1.2, help="每次请求的间隔秒数")
    ap.add_argument("--force-covers", action="store_true", help="已存在的封面也重新下载")
    ap.add_argument("--no-covers", action="store_true", help="完全跳过封面下载")
    args = ap.parse_args()

    uid = resolve_uid(args.uid)

    kinds = [k.strip() for k in args.kinds.split(",") if k.strip()]
    for k in kinds:
        if k not in SITES:
            sys.exit(f"未知类型 {k!r}，可选：{', '.join(SITES)}")

    f = Fetcher(delay=args.delay)
    print(f"同步豆瓣用户 {uid}：{', '.join(kinds)}")
    print("（每次请求间隔 %.1fs，别中断，豆瓣会限流）" % args.delay)

    all_items, counts = [], {}
    for kind in kinds:
        print(f"  [{kind}]")
        got = crawl(f, uid, kind, args.limit)
        counts[kind] = len(got)
        print(f"    → {len(got)} 条")
        all_items.extend(got)

    # 全量按日期倒序（用户选的就是这个）。日期缺失的排最后。
    all_items.sort(key=lambda x: (x.get("date") or "0000-00-00"), reverse=True)

    # 封面
    if not args.no_covers:
        need = [i for i in all_items if i.get("cover_src")]
        print(f"  封面：{len(need)} 张（已存在的会跳过）")
        for n, item in enumerate(need, 1):
            rel = fetch_cover(f, item, args.cover_dir, args.force_covers)
            item["cover"] = rel
            if n % 20 == 0 or n == len(need):
                print(f"      {n}/{len(need)}")

    # 落盘前把 cover_src 摘掉（豆瓣的原始地址带防盗链，留着没用还会被误用）
    for i in all_items:
        i.pop("cover_src", None)

    tz = timezone(timedelta(hours=8))
    payload = {
        "updated": datetime.now(tz).isoformat(timespec="seconds"),
        "uid": uid,
        "status": STATUS,
        "counts": counts,
        "total": len(all_items),
        "items": all_items,
    }

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, ensure_ascii=False, indent=1)
        fp.write("\n")

    # ---- 自检：这几条最能反映解析有没有跑偏
    no_creator = sum(1 for i in all_items if not i.get("creator"))
    no_year = sum(1 for i in all_items if not i.get("year"))
    no_rating = sum(1 for i in all_items if i.get("rating") is None)
    with_comment = sum(1 for i in all_items if i.get("comment"))
    print()
    print(f"✅ 写入 {args.out}：共 {len(all_items)} 条 {counts}")
    print(f"   缺 creator {no_creator} / 缺 year {no_year} / 无评分 {no_rating} / 有短评 {with_comment}")
    if no_creator:
        print("   ⚠️ 缺 creator 的多半是影视 —— 检查 COUNTRIES 里有没有漏掉的国家")


if __name__ == "__main__":
    main()
