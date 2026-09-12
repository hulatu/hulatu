#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
热门榜数据抓取：giscus「热议」（GitHub Discussions）+ Cloudflare「热读」（Web Analytics）。

用法：
    GITHUB_TOKEN=xxx CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx python3 scripts/fetch_hot.py

输出：data/hot.json

    discussed / viewed  两个榜单的 top N，供 layouts/partials/hot-list.html 渲染
    byPath              全量计数 {规范化路径: {comments, reactions, views}}，
                        由 layouts/index.postindex.json 注入 public/post-index.json，
                        供文章页与列表页显示「N 条评论 · N 次阅读」

两个数据源彼此独立：任一失败只影响自己那一半，另一半照常写入；
两边都失败时不覆盖旧文件。没有任何 token 时脚本只打印提示、正常退出，
不会阻断 ./publish.sh。

环境变量：
    GITHUB_TOKEN        GitHub PAT。classic 勾 public_repo，或 fine-grained 给 Discussions: Read
    GISCUS_REPO         默认 hulatu/hulatu
    GISCUS_CATEGORY_ID  默认 DIC_kwDOTApIws4DCXd5（giscus 用的 Announcements 分类）
    CF_API_TOKEN        Cloudflare API Token（权限：Account → Account Analytics → Read）
    CF_ACCOUNT_ID       Cloudflare 账户 ID
    CF_SITE_TAG         Web Analytics 站点标识；留空时自动从 RUM 站点列表里找
    HOT_DAYS            统计窗口天数，默认 30
    HOT_LIMIT           每个榜单保留条数，默认 5
    HOT_BASE_URL        站点地址，默认 https://hulatu.com/

调试：
    python3 scripts/fetch_hot.py --demo          # 用假数字写一份示例数据，先看版式
    python3 scripts/fetch_hot.py --introspect    # 打印 RUM 数据集可用的字段与维度
"""

import datetime
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
POST_INDEX = ROOT / "public" / "post-index.json"
OUT = ROOT / "data" / "hot.json"

GITHUB_GQL = "https://api.github.com/graphql"
CF_GQL = "https://api.cloudflare.com/client/v4/graphql"
CF_RUM_LIST = "https://api.cloudflare.com/client/v4/accounts/%s/rum/site_info/list"

DEFAULT_BASE_URL = "https://hulatu.com/"
# giscus 用的分类（hugo.toml 里 [params.giscus].categoryId 的值）
DEFAULT_CATEGORY_ID = "DIC_kwDOTApIws4DCXd5"

# 只取 title / url / 评论数 / reaction 数。
# 故意不在查询里带 categoryId：这样即使该参数在 schema 里有变动也能跑通，
# 分类过滤改在本地做（节点里已经取了 category.id）。
GISCUS_QUERY = """
query {
  repository(owner: %s, name: %s) {
    discussions(first: 100%s) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        url
        number
        category { id name }
        comments { totalCount }
        reactions { totalCount }
      }
    }
  }
}
"""

# limit 是「返回的分组数」上限而不是事件数上限，给足余量再在本地排序。
CF_QUERY = """
query {
  viewer {
    accounts(filter: {accountTag: %s}) {
      rumPageloadEventsAdaptiveGroups(
        limit: %d
        orderBy: [count_DESC]
        filter: {
          siteTag: %s
          datetime_geq: %s
          datetime_leq: %s
        }
      ) {
        count
        dimensions {
          requestPath
          requestHost
        }
      }
    }
  }
}
"""

CF_INTROSPECT = """
query {
  __type(name: %s) {
    fields {
      name
      type { name kind ofType { name } }
    }
  }
}
"""


# --------------------------------------------------------------------------
# 小工具
# --------------------------------------------------------------------------

def warn(msg):
    sys.stderr.write("[hot] !! %s\n" % msg)


def info(msg):
    sys.stderr.write("[hot] %s\n" % msg)


def ok(msg):
    sys.stdout.write("[hot] %s\n" % msg)


def int_env(name, default):
    raw = (os.environ.get(name) or "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError:
        warn("%s=%r 不是整数，改用默认值 %d" % (name, raw, default))
        return default
    return value if value > 0 else default


def read_text(path):
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def http_json(url, payload=None, headers=None, timeout=30):
    hdrs = {
        "User-Agent": "hulatu-blog-hot/1.0 (+https://hulatu.com/)",
        "Accept": "application/json",
    }
    if headers:
        hdrs.update(headers)

    body = None
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        hdrs["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")[:400]
        except Exception:
            pass
        raise RuntimeError("HTTP %s %s %s" % (exc.code, exc.reason, detail))
    except Exception as exc:
        raise RuntimeError(str(exc))

    try:
        return json.loads(raw)
    except ValueError as exc:
        raise RuntimeError("响应不是合法 JSON：%s" % exc)


def norm_path(value):
    """把 URL / 路径 / 讨论标题统一成可比较的键：去域名、去查询串、去首尾斜杠、转小写。"""
    text = urllib.parse.unquote(str(value or "")).strip()
    text = text.split("#")[0].split("?")[0]
    return text.strip("/").lower()


def site_host():
    base = (os.environ.get("HOT_BASE_URL") or DEFAULT_BASE_URL).strip()
    return (urllib.parse.urlparse(base).hostname or "").lower()


# --------------------------------------------------------------------------
# 文章索引：路径 -> {title, url}
# --------------------------------------------------------------------------

def front_matter(text):
    """极简 YAML front matter 解析，只取顶层 key: value。够用即可。"""
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        mm = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*?)\s*$", line)
        if not mm:
            continue
        out[mm.group(1)] = mm.group(2).strip().strip('"').strip("'")
    return out


def load_posts_from_content():
    """public/post-index.json 不存在时的兜底：从 content/ 的 slug + date 推地址。

    permalink 规则在 hugo.toml 里是 /posts/:year/:month/:day/:slug/，
    所以只要文章填了 slug 就能算出来；没填 slug 的会跳过（标题退化成路径）。
    """
    out = {}
    for sub in ("posts", "weekly"):
        folder = ROOT / "content" / sub
        if not folder.is_dir():
            continue
        for md in sorted(folder.glob("*.md")):
            fm = front_matter(read_text(md)[:4000])
            slug = fm.get("slug")
            date = fm.get("date")
            if not slug or not date:
                continue
            m = re.match(r"(\d{4})-(\d{2})-(\d{2})", date)
            if not m:
                continue
            url = "/posts/%s/%s/%s/%s/" % (m.group(1), m.group(2), m.group(3), slug)
            out[norm_path(url)] = {"title": fm.get("title") or slug, "url": url}
    return out


def load_posts():
    data = read_json(POST_INDEX) if POST_INDEX.exists() else None
    if isinstance(data, list) and data:
        posts = {}
        for item in data:
            if not isinstance(item, dict):
                continue
            url = item.get("url")
            if url:
                posts[norm_path(url)] = {"title": item.get("title") or url, "url": url}
        if posts:
            return posts
        warn("%s 里没有可用的 url 字段" % POST_INDEX.relative_to(ROOT))

    posts = load_posts_from_content()
    if posts:
        info("没有可用的 %s，改从 content/ 的 slug + date 推算地址（%d 篇）"
             % (POST_INDEX.relative_to(ROOT), len(posts)))
        return posts

    warn("拿不到文章索引，标题会退化成路径。先跑一次 ./deploy.sh 或 hugo 效果更好。")
    return {}


def resolve(posts, key):
    """把规范化路径换成 (标题, 链接)。索引为空时退化成路径；匹配不到返回 None。"""
    post = posts.get(key)
    if post:
        return (post.get("title") or "/" + key + "/", post.get("url") or "/" + key + "/")
    if not posts:
        return ("/" + key + "/", "/" + key + "/")
    return None


# --------------------------------------------------------------------------
# 数据源一：giscus 热议（GitHub Discussions）
# --------------------------------------------------------------------------

def candidate_paths(title):
    """讨论标题 -> 若干候选路径键。giscus 的 pathname 映射把标题设成页面路径，
    但为稳妥起见，同时尝试从标题里抽出形如 /posts/... 的片段。"""
    text = str(title or "").strip()
    raw = [text]
    raw.extend(re.findall(r"/[A-Za-z0-9_\-/%.]+", text))

    out = []
    for item in raw:
        key = norm_path(item)
        if key and key not in out:
            out.append(key)
    return out


def giscus_pages(owner, name, token, cursor):
    after = ', after: %s' % json.dumps(cursor) if cursor else ""
    query = GISCUS_QUERY % (json.dumps(owner), json.dumps(name), after)
    payload = {"query": query}
    headers = {"Authorization": "bearer " + token}
    try:
        res = http_json(GITHUB_GQL, payload, headers)
    except Exception as exc:
        return (None, "请求 GitHub 失败：%s" % exc)

    if res.get("errors"):
        detail = json.dumps(res["errors"], ensure_ascii=False)
        return (None, detail[:400])

    repo = ((res.get("data") or {}).get("repository")) or {}
    conn = repo.get("discussions") or {}
    return (conn, None)


def fetch_giscus(posts, limit):
    """返回 (top N 榜单, 全量计数)；失败时 (None, None)。

    计数键是 norm_path() 规范化后的路径，与 layouts/index.postindex.json 里
    `strings.Trim (lower $page.RelPermalink) "/"` 的结果一致。
    （Hugo 的 strings.Trim 是 STRING CUTSET，不能用管道写法，否则 key 恒为空串。）
    """
    token = (os.environ.get("GITHUB_TOKEN") or "").strip()
    if not token:
        warn("未设置 GITHUB_TOKEN，跳过「热议」榜")
        return (None, None)

    repo = (os.environ.get("GISCUS_REPO") or "hulatu/hulatu").strip()
    if "/" not in repo:
        warn("GISCUS_REPO 应为 owner/name，当前是 %r" % repo)
        return (None, None)
    owner, name = repo.split("/", 1)

    category_id = (os.environ.get("GISCUS_CATEGORY_ID") or DEFAULT_CATEGORY_ID).strip()

    nodes = []
    cursor = None
    for _ in range(6):  # 最多 600 条讨论
        conn, err = giscus_pages(owner, name, token, cursor)
        if err:
            warn("拉取 GitHub 讨论失败：%s" % err)
            warn("确认 token 有 Discussions 读取权限；仓库需开启 Discussions 且为公开仓库")
            return (None, None)
        nodes.extend(conn.get("nodes") or [])
        page = conn.get("pageInfo") or {}
        if not page.get("hasNextPage"):
            break
        cursor = page.get("endCursor")
        if not cursor:
            break

    items = []
    counts = {}
    skipped_category = 0
    unmatched = 0
    for node in nodes:
        if not isinstance(node, dict):
            continue

        # 分类过滤在本地做：giscus 的讨论都落在同一个分类里
        if category_id:
            cat = node.get("category") or {}
            if cat.get("id") and cat.get("id") != category_id:
                skipped_category += 1
                continue

        comments = int(((node.get("comments") or {}).get("totalCount")) or 0)
        reactions = int(((node.get("reactions") or {}).get("totalCount")) or 0)

        key = None
        for cand in candidate_paths(node.get("title")):
            if cand in posts:
                key = cand
                break
        if key is None and not posts:
            cands = candidate_paths(node.get("title"))
            key = cands[0] if cands else None
        if key is None:
            unmatched += 1
            continue

        resolved = resolve(posts, key)
        if not resolved:
            unmatched += 1
            continue

        # 全量计数：0 条评论也记下来，文章页才能区分「没有数据」和「0 条评论」
        counts[key] = {"comments": comments, "reactions": reactions}

        if comments <= 0:
            continue  # 榜单只收真的有讨论的

        items.append({
            "title": resolved[0],
            "url": resolved[1],
            "comments": comments,
            "reactions": reactions,
            "discussion": node.get("url") or "",
        })

    items.sort(key=lambda x: (-x["comments"], -x["reactions"]))
    if skipped_category:
        info("热议：跳过 %d 条非 giscus 分类的讨论" % skipped_category)
    if unmatched:
        info("热议：%d 条讨论没对应到文章（留言板等非文章页），已忽略" % unmatched)
    return (items[:limit], counts)


# --------------------------------------------------------------------------
# 数据源二：Cloudflare 热读（Web Analytics / RUM）
# --------------------------------------------------------------------------

def cf_site_tag(account, token):
    try:
        res = http_json(CF_RUM_LIST % account, None, {"Authorization": "Bearer " + token})
    except Exception as exc:
        warn("读取 Web Analytics 站点列表失败：%s" % exc)
        return None

    if not res.get("success"):
        warn("读取 Web Analytics 站点列表失败：%s"
             % json.dumps(res.get("errors"), ensure_ascii=False)[:300])
        return None

    sites = [s for s in (res.get("result") or []) if isinstance(s, dict)]
    tags = [s.get("site_tag") for s in sites if s.get("site_tag")]

    if len(tags) == 1:
        return tags[0]

    # 一个站点可能覆盖多个域名，优先挑和本站 host 对得上的那个
    host = site_host()
    if host:
        for site in sites:
            names = [str(r.get("host") or "") for r in (site.get("rules") or []) if isinstance(r, dict)]
            names.append(str((site.get("ruleset") or {}).get("zone_name") or ""))
            if any(host in n for n in names if n):
                return site.get("site_tag")

    if tags:
        warn("账户下有 %d 个 Web Analytics 站点，请在 CF_SITE_TAG 里指定：%s"
             % (len(tags), ", ".join(tags)))
    else:
        warn("账户下没有 Web Analytics 站点，先去 Cloudflare 后台为 hulatu.com 开启 Web Analytics")
    return None


def fetch_cloudflare(posts, limit, days):
    """返回 (top N 榜单, 全量计数)；失败时 (None, None)。计数键同样是规范化路径。"""
    token = (os.environ.get("CF_API_TOKEN") or "").strip()
    account = (os.environ.get("CF_ACCOUNT_ID") or "").strip()
    if not token or not account:
        warn("未设置 CF_API_TOKEN / CF_ACCOUNT_ID，跳过「热读」榜")
        return (None, None)

    site = (os.environ.get("CF_SITE_TAG") or "").strip() or cf_site_tag(account, token)
    if not site:
        warn("拿不到 Web Analytics 的 site_tag，跳过「热读」榜")
        return (None, None)

    end = datetime.datetime.now(datetime.timezone.utc)
    start = end - datetime.timedelta(days=days)
    query = CF_QUERY % (
        json.dumps(account),
        1000,
        json.dumps(site),
        json.dumps(start.strftime("%Y-%m-%dT%H:%M:%SZ")),
        json.dumps(end.strftime("%Y-%m-%dT%H:%M:%SZ")),
    )

    try:
        res = http_json(CF_GQL, {"query": query}, {"Authorization": "Bearer " + token})
    except Exception as exc:
        warn("请求 Cloudflare GraphQL 失败：%s" % exc)
        return (None, None)

    # Cloudflare 把查询级错误放在 HTTP 200 的 errors 里，必须显式判断
    if res.get("errors"):
        warn("Cloudflare GraphQL 返回错误：%s"
             % json.dumps(res["errors"], ensure_ascii=False)[:400])
        warn("若提示 requestPath 字段不存在，跑 python3 scripts/fetch_hot.py --introspect 看可用维度")
        return (None, None)

    accounts = ((res.get("data") or {}).get("viewer") or {}).get("accounts") or [{}]
    groups = (accounts[0] or {}).get("rumPageloadEventsAdaptiveGroups") or []

    host = site_host()
    views = {}
    for group in groups:
        if not isinstance(group, dict):
            continue
        dims = group.get("dimensions") or {}
        row_host = str(dims.get("requestHost") or "").lower()
        if host and row_host and row_host != host:
            continue  # 同一个 site_tag 可能覆盖多个域名，只统计本站
        key = norm_path(dims.get("requestPath"))
        if not key:
            continue
        try:
            count = int(group.get("count") or 0)
        except (TypeError, ValueError):
            continue
        views[key] = views.get(key, 0) + count

    items = []
    counts = {}
    for key, count in sorted(views.items(), key=lambda kv: -kv[1]):
        resolved = resolve(posts, key)
        if not resolved:
            continue
        counts[key] = count  # 全量：榜单只取前 limit 条，计数全留
        if len(items) < limit:
            items.append({"title": resolved[0], "url": resolved[1], "views": count})
    return (items, counts)


# --------------------------------------------------------------------------
# introspection：维度名变了的时候用它自查
# --------------------------------------------------------------------------

def introspect():
    token = (os.environ.get("CF_API_TOKEN") or "").strip()
    if not token:
        warn("需要 CF_API_TOKEN 才能做 introspection")
        return 1

    headers = {"Authorization": "Bearer " + token}

    # 类型名在不同账户/套餐下可能是 AccountRum* 或 Rum*，逐个试
    node = None
    used = None
    for candidate in (
        "AccountRumPageloadEventsAdaptiveGroups",
        "RumPageloadEventsAdaptiveGroups",
        "AccountRumPageloadEventsAdaptive",
    ):
        try:
            res = http_json(CF_GQL, {"query": CF_INTROSPECT % json.dumps(candidate)}, headers)
        except Exception as exc:
            warn("introspection 请求失败：%s" % exc)
            return 1
        if res.get("errors"):
            warn("introspection 返回错误：%s"
                 % json.dumps(res["errors"], ensure_ascii=False)[:300])
            return 1
        found = (res.get("data") or {}).get("__type")
        if found:
            node, used = found, candidate
            break

    if not node:
        warn("没能定位到 RUM 数据集的类型名，请到 Cloudflare 文档确认节点名后再改脚本")
        return 1

    dims_type = None
    print("%s 字段：" % used)
    for field in node.get("fields") or []:
        ftype = field.get("type") or {}
        name = ftype.get("name") or (ftype.get("ofType") or {}).get("name") or ftype.get("kind") or "?"
        print("  %-24s %s" % (field.get("name"), name))
        if field.get("name") == "dimensions":
            dims_type = name

    if dims_type:
        try:
            res2 = http_json(
                CF_GQL,
                {"query": 'query { __type(name: %s) { fields { name } } }' % json.dumps(dims_type)},
                headers,
            )
        except Exception as exc:
            warn("读取维度字段失败：%s" % exc)
            return 1
        dims = (res2.get("data") or {}).get("__type") or {}
        print("\n%s 可用维度：" % dims_type)
        for field in dims.get("fields") or []:
            print("  " + str(field.get("name")))
    return 0


# --------------------------------------------------------------------------

def demo(limit):
    """用真实文章标题 + 假数字写一份示例数据，方便先看版式。
    写出的文件带 demo: true，页面上会显式标出「示例数据」。"""
    posts = load_posts()
    picked = [v for _, v in sorted(posts.items(), key=lambda kv: kv[1].get("title") or "")][:limit]
    if not picked:
        warn("没有文章索引，做不出示例数据；先跑一次 hugo 或 ./deploy.sh")
        return 1

    discussed = []
    viewed = []
    for i, post in enumerate(picked):
        title = post.get("title") or post.get("url")
        url = post.get("url")
        discussed.append({
            "title": title,
            "url": url,
            "comments": max(1, 14 - i * 2),
            "reactions": max(0, 6 - i),
            "discussion": "",
        })
        viewed.append({
            "title": title,
            "url": url,
            "views": max(1, 320 - i * 27),
        })

    # 示例数据也给一份 byPath，这样文章页/列表页的「N 条评论 · N 次阅读」能一起预览
    by_path = {}
    for post, d, v in zip(picked, discussed, viewed):
        key = norm_path(post.get("url"))
        if key:
            by_path[key] = {
                "comments": d["comments"],
                "reactions": d["reactions"],
                "views": v["views"],
            }

    payload = {
        "generated": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "days": int_env("HOT_DAYS", 30),
        "limit": limit,
        "demo": True,
        "discussed": discussed,
        "viewed": viewed,
        "byPath": by_path,
        "sources": {"giscus": False, "cloudflare": False},
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ok("已写入示例数据到 %s（页面会显示「示例数据」角标）" % OUT.relative_to(ROOT))
    ok("看完删掉即可：rm data/hot.json")
    return 0


def main(argv):
    if "--introspect" in argv:
        return introspect()
    if "--demo" in argv:
        return demo(int_env("HOT_LIMIT", 5))

    days = int_env("HOT_DAYS", 30)
    limit = int_env("HOT_LIMIT", 5)

    posts = load_posts()
    old = read_json(OUT) or {}

    sources = {"giscus": False, "cloudflare": False}

    discussed, giscus_counts = fetch_giscus(posts, limit)
    if discussed is None:
        discussed = old.get("discussed") or []
        if discussed:
            info("「热议」榜抓取失败，沿用上一次的 %d 条" % len(discussed))
    else:
        sources["giscus"] = True

    viewed, view_counts = fetch_cloudflare(posts, limit, days)
    if viewed is None:
        viewed = old.get("viewed") or []
        if viewed:
            info("「热读」榜抓取失败，沿用上一次的 %d 条" % len(viewed))
    else:
        sources["cloudflare"] = True

    if not sources["giscus"] and not sources["cloudflare"]:
        warn("两个数据源都没有成功，保留原有的 %s 不动"
             % OUT.relative_to(ROOT))
        return 0

    # 全量计数：先继承旧值，再让这次抓成功的源整体覆盖。
    # 覆盖而不是合并，是为了清掉已删除的讨论 / 已下线的路径。
    by_path = {}
    for key, stat in (old.get("byPath") or {}).items():
        if isinstance(stat, dict):
            by_path[key] = dict(stat)

    if sources["giscus"]:
        for stat in by_path.values():
            stat.pop("comments", None)
            stat.pop("reactions", None)
        for key, stat in (giscus_counts or {}).items():
            by_path.setdefault(key, {}).update(stat)

    if sources["cloudflare"]:
        for stat in by_path.values():
            stat.pop("views", None)
        for key, count in (view_counts or {}).items():
            by_path.setdefault(key, {})["views"] = count

    by_path = {k: v for k, v in by_path.items() if v}

    payload = {
        "generated": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "days": days,
        "limit": limit,
        "discussed": discussed,
        "viewed": viewed,
        "byPath": by_path,
        "sources": sources,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ok("已写入 %s：热议 %d 条 / 热读 %d 条 / 计数覆盖 %d 篇"
       % (OUT.relative_to(ROOT), len(discussed), len(viewed), len(by_path)))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except KeyboardInterrupt:
        sys.exit(130)
