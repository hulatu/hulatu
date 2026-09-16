#!/usr/bin/env python3
"""从 Garmin Connect 同步跑步记录到 data/runs.json。

本地使用：
    ./publish.sh   # 自动用本机令牌同步并提交推送
    或直接：python3 scripts/sync-garmin.py

本机令牌由 scripts/garmin-token.py 生成，保存在 ~/.garminconnect/garmin_tokens.json，
存在时优先使用，不需要每次输账号密码。

也可把 garmin-token.py 打印的长字符串存为 GitHub Secret：GARMINTOKENS，
手动触发 GitHub Actions 同步（见 .github/workflows/sync-garmin.yml）。

环境变量：
    GARMIN_EMAIL      Garmin 账号邮箱（必填）
    GARMIN_PASSWORD   Garmin 密码（必填）
    GARMIN_REGION     可选，cn 表示中国区账号（garmin.cn），不设时自动从令牌识别
    GARMINTOKENS      可选但推荐。登录令牌（scripts/garmin-token.py 生成），优先使用
    GARMIN_MFA_CODE   可选，账号开启两步验证时填当前验证码
    GARMIN_TYPES      可选，要同步的运动类型，逗号分隔，默认 running
    GARMIN_LIMIT      可选，每次最多拉取多少条，默认 100
"""

from __future__ import annotations

import json
import os
import sys
import base64
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "runs.json"
RUN_SITE_DATA_FILE = ROOT / "sites" / "run" / "data" / "runs.json"
PROFILE_RUN_SUMMARY_FILE = ROOT / "sites" / "profile" / "data" / "run_summary.json"


def _token_text_indicates_cn(token_text: str) -> bool:
    """判断令牌是否属于中国区（garmin.cn）账号。

    garminconnect 0.3.x 的令牌是 JSON，其中 di_token 是 JWT，
    明文里不再有 prod-cn 字样，需要解码 JWT 的 iss 字段判断。
    旧格式令牌若直接含 garmin.cn / prod-cn，也能兼容识别。
    """
    lowered = token_text.lower()
    if "garmin.cn" in lowered or "prod-cn" in lowered:
        return True
    if "garmin.com" in lowered:
        return False

    raw = token_text
    if not raw.lstrip().startswith("{"):
        # 兼容旧脚本导出的 base64 令牌
        try:
            raw = base64.b64decode(raw).decode("utf-8")
            if "garmin.cn" in raw.lower() or "prod-cn" in raw.lower():
                return True
            if "garmin.com" in raw.lower():
                return False
        except Exception:
            return False

    try:
        data = json.loads(raw)
        di_token = data.get("di_token") or ""
        parts = di_token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            payload_b64 += "=" * (-len(payload_b64) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            return str(payload.get("iss", "")).endswith("garmin.cn")
    except Exception:
        pass
    return False


def load_existing() -> dict:
    if not DATA_FILE.exists():
        return {"updated": "", "activities": []}
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        sys.exit(f"读取 {DATA_FILE} 失败：{exc}")


def to_item(activity: dict, allowed_types: set[str]) -> dict | None:
    atype = activity.get("activityType") or {}
    type_key = atype.get("typeKey", "")
    if type_key not in allowed_types:
        return None

    start_time = activity.get("startTimeLocal") or ""
    activity_id = str(activity.get("activityId") or "")
    if not start_time or not activity_id:
        return None

    distance_m = activity.get("distance") or 0
    duration_s = activity.get("duration") or 0

    item: dict = {
        "id": activity_id,
        "date": start_time[:10],
        "distance_km": round(distance_m / 1000.0, 2),
        "duration_s": round(duration_s),
    }
    avg_hr = activity.get("averageHR")
    if avg_hr:
        item["avg_hr"] = round(avg_hr)
    calories = activity.get("calories")
    if calories:
        item["calories"] = round(calories)
    return item


def fingerprint(item: dict) -> tuple:
    """生成除活动 id 外的内容指纹，用于防止 Garmin 返回不同 id 的重复记录。"""
    return tuple(sorted((k, str(v)) for k, v in item.items() if k != "id"))


def _pace_seconds(item: dict) -> int | None:
    distance_km = float(item.get("distance_km") or 0)
    duration_s = float(item.get("duration_s") or 0)
    if distance_km <= 0 or duration_s <= 0:
        return None
    return int(round(duration_s / distance_km))


def _format_pace(seconds: int | None) -> str | None:
    if seconds is None:
        return None
    seconds = int(round(seconds))
    return f"{seconds // 60}:{seconds % 60:02d}"


def add_pace(item: dict) -> dict:
    """给单条跑步记录补充配速字段，供 run.hulatu.com 直接展示。"""
    enriched = dict(item)
    pace = _pace_seconds(item)
    if pace is not None:
        enriched["pace_s"] = pace
        enriched["pace"] = _format_pace(pace)
    return enriched


def _record(item: dict) -> dict:
    return {
        "id": item.get("id"),
        "date": item.get("date"),
        "distance_km": item.get("distance_km"),
        "duration_s": item.get("duration_s"),
        "pace_s": item.get("pace_s"),
        "pace": item.get("pace"),
        "avg_hr": item.get("avg_hr"),
        "calories": item.get("calories"),
    }


def _summarise(items: list[dict], year: str | None = None, month: str | None = None) -> dict:
    count = len(items)
    distance = round(sum(float(i.get("distance_km") or 0) for i in items), 2)
    duration = int(round(sum(float(i.get("duration_s") or 0) for i in items)))
    calories = int(round(sum(float(i.get("calories") or 0) for i in items)))
    hr_values = [int(i["avg_hr"]) for i in items if i.get("avg_hr")]
    avg_hr = round(sum(hr_values) / len(hr_values)) if hr_values else None
    pace_s = _pace_seconds({"distance_km": distance, "duration_s": duration})
    summary: dict = {
        "count": count,
        "distance_km": distance,
        "duration_s": duration,
        "calories": calories,
        "avg_hr": avg_hr,
        "pace_s": pace_s,
        "pace": _format_pace(pace_s),
    }
    if year is not None:
        summary["year"] = year
    if month is not None:
        summary["month"] = month
    return summary


def compute_stats(activities: list[dict]) -> dict:
    """生成 run.hulatu.com 需要的派生统计数据。"""
    enriched = [add_pace(item) for item in activities]
    enriched.sort(key=lambda x: (x.get("date", ""), str(x.get("id", ""))))

    totals = _summarise(enriched)
    totals["latest_date"] = enriched[-1]["date"] if enriched else None
    if not enriched:
        return {
            "totals": totals,
            "best": {},
            "recent7": _summarise([]),
            "recent30": _summarise([]),
            "streak_current": 0,
            "streak_longest": 0,
            "yearly": [],
            "monthly": [],
            "by_year": [],
        }

    longest = max(enriched, key=lambda x: float(x.get("distance_km") or 0))
    fastest_candidates = [x for x in enriched if x.get("pace_s")]
    fastest = min(fastest_candidates, key=lambda x: x["pace_s"]) if fastest_candidates else {}
    most_calories_candidates = [x for x in enriched if x.get("calories")]
    most_calories = (
        max(most_calories_candidates, key=lambda x: x["calories"])
        if most_calories_candidates
        else {}
    )
    highest_hr_candidates = [x for x in enriched if x.get("avg_hr")]
    highest_hr = (
        max(highest_hr_candidates, key=lambda x: x["avg_hr"])
        if highest_hr_candidates
        else {}
    )

    latest = date.fromisoformat(enriched[-1]["date"])
    start7 = latest - timedelta(days=6)
    start30 = latest - timedelta(days=29)
    recent7 = [
        x for x in enriched if start7 <= date.fromisoformat(x["date"]) <= latest
    ]
    recent30 = [
        x for x in enriched if start30 <= date.fromisoformat(x["date"]) <= latest
    ]

    dates = sorted({date.fromisoformat(x["date"]) for x in enriched})
    streak_current = 0
    cursor = latest
    date_set = set(dates)
    while cursor in date_set:
        streak_current += 1
        cursor -= timedelta(days=1)

    streak_longest = 0
    current_streak = 0
    previous: date | None = None
    for run_date in dates:
        if previous is not None and (run_date - previous).days == 1:
            current_streak += 1
        else:
            current_streak = 1
        streak_longest = max(streak_longest, current_streak)
        previous = run_date

    year_groups: dict[str, list[dict]] = {}
    month_groups: dict[str, list[dict]] = {}
    for item in enriched:
        run_date = item["date"]
        year_groups.setdefault(run_date[:4], []).append(item)
        month_groups.setdefault(run_date[:7], []).append(item)

    yearly = [
        _summarise(year_groups[year], year=year)
        for year in sorted(year_groups, reverse=True)
    ]
    monthly = [
        _summarise(month_groups[month], month=month)
        for month in sorted(month_groups)
    ]

    descending = sorted(
        enriched, key=lambda x: (x.get("date", ""), str(x.get("id", ""))), reverse=True
    )
    by_year = []
    for summary in yearly:
        year = summary["year"]
        by_year.append(
            {
                "year": year,
                "summary": summary,
                "activities": [_record(x) for x in descending if x["date"][:4] == year],
            }
        )

    return {
        "totals": totals,
        "best": {
            "longest": _record(longest),
            "fastest": _record(fastest) if fastest else {},
            "most_calories": _record(most_calories) if most_calories else {},
            "highest_hr": _record(highest_hr) if highest_hr else {},
        },
        "recent7": _summarise(recent7),
        "recent30": _summarise(recent30),
        "streak_current": streak_current,
        "streak_longest": streak_longest,
        "yearly": yearly,
        "monthly": monthly,
        "by_year": by_year,
    }


def main() -> None:
    # 去掉令牌里的空白/换行（复制时可能混入）
    tokens = "".join(os.environ.get("GARMINTOKENS", "").split())
    email = os.environ.get("GARMIN_EMAIL", "").strip()
    password = os.environ.get("GARMIN_PASSWORD", "")
    region_env = os.environ.get("GARMIN_REGION", "").strip().lower()
    # 显式设置 GARMIN_REGION 时以它为准；未设置时从令牌内容自动识别
    is_cn = region_env == "cn"

    # 本机令牌：garmin-token.py 生成后保存在 ~/.garminconnect/garmin_tokens.json，
    # 存在时优先使用；令牌的 iss / 域名会标明是否中国区账号。
    local_tokenstore = Path.home() / ".garminconnect"
    local_token_file = local_tokenstore / "garmin_tokens.json"
    use_local_store = local_token_file.is_file()
    if not region_env and use_local_store:
        try:
            if _token_text_indicates_cn(local_token_file.read_text(encoding="utf-8")):
                is_cn = True
        except OSError:
            pass
    if not region_env and not use_local_store and tokens:
        if _token_text_indicates_cn(tokens):
            is_cn = True

    if not use_local_store and not tokens and (not email or not password):
        sys.exit("缺少登录信息：请先运行 python3 scripts/garmin-token.py 生成本机令牌，"
                 "或设置 GARMIN_EMAIL + GARMIN_PASSWORD / GARMINTOKENS。")
    if tokens and len(tokens) < 100:
        print("警告：GARMINTOKENS 看起来不完整（正常令牌是很长的一串），将回退到账号密码登录。")

    allowed_types = {
        t.strip()
        for t in os.environ.get("GARMIN_TYPES", "running").split(",")
        if t.strip()
    }
    try:
        limit = int(os.environ.get("GARMIN_LIMIT", "100"))
    except ValueError:
        limit = 100

    try:
        from garminconnect import Garmin, GarminConnectAuthenticationError
    except ImportError:
        sys.exit("未安装 garminconnect，请先执行：pip install --upgrade garminconnect")

    def mfa_code() -> str:
        code = os.environ.get("GARMIN_MFA_CODE", "").strip()
        if not code:
            raise RuntimeError("账号开启了双重验证，请把当前验证码填入 GARMIN_MFA_CODE 后重试")
        return code

    try:
        # 始终带上账号密码作为兜底；有令牌时优先用令牌
        client = Garmin(
            email=email or None,
            password=password or None,
            prompt_mfa=mfa_code,
            is_cn=is_cn,
        )
        if use_local_store:
            # 直接用本机令牌，避免输密码 / 两步验证
            print("使用本机令牌登录（~/.garminconnect）……")
            client.login(str(local_tokenstore))
        elif tokens:
            # 有令牌时直接用令牌登录，避免每次从数据中心 IP 输密码被限流
            print("使用 GARMINTOKENS 令牌登录……")
            client.login(tokens)
        else:
            print("使用账号密码登录……")
            client.login()
    except GarminConnectAuthenticationError as exc:
        msg = str(exc)
        if "Username and password are required" in msg:
            sys.exit(
                "登录信息无效：GARMINTOKENS 不是有效的令牌，且 GARMIN_EMAIL/GARMIN_PASSWORD "
                "为空或不被接受。请检查 GitHub Secrets：令牌必须是 garmin-token.py 打印的完整字符串；"
                "账号密码必须能用浏览器登录 garmin.cn。"
            )
        sys.exit(f"Garmin 登录失败（请检查账号密码/验证码）：{msg}")
    except Exception as exc:
        sys.exit(f"Garmin 登录失败：{exc}")

    try:
        activities = client.get_activities(0, limit)
    except Exception as exc:
        sys.exit(f"拉取活动列表失败：{exc}")

    data = load_existing()
    seen_ids = set()
    seen_fingerprints = set()
    merged_rows = []
    for item in data.get("activities", []):
        item_id = str(item.get("id"))
        item_fingerprint = fingerprint(item)
        if item_id in seen_ids or item_fingerprint in seen_fingerprints:
            continue
        if item_id:
            seen_ids.add(item_id)
        seen_fingerprints.add(item_fingerprint)
        merged_rows.append(item)

    added = 0
    for activity in activities or []:
        item = to_item(activity, allowed_types)
        if item is None:
            continue
        item_fingerprint = fingerprint(item)
        if item["id"] in seen_ids or item_fingerprint in seen_fingerprints:
            continue
        seen_ids.add(item["id"])
        seen_fingerprints.add(item_fingerprint)
        merged_rows.append(item)
        added += 1

    merged = sorted(merged_rows, key=lambda x: (x["date"], x["id"]))
    data["updated"] = datetime.now().astimezone().isoformat(timespec="seconds")
    data["activities"] = [add_pace(item) for item in merged]
    data["stats"] = compute_stats(data["activities"])

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    RUN_SITE_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    RUN_SITE_DATA_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    totals = data.get("stats", {}).get("totals", {})
    profile_summary = {
        "count": totals.get("count", len(merged)),
        "distance_km": totals.get("distance_km", 0),
        "avg_pace": totals.get("pace") or "—",
        "latest_date": totals.get("latest_date") or (merged[-1]["date"] if merged else ""),
        "updated": (merged[-1]["date"] if merged else datetime.now().date().isoformat()),
    }
    PROFILE_RUN_SUMMARY_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROFILE_RUN_SUMMARY_FILE.write_text(
        json.dumps(profile_summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"同步完成：新增 {added} 条，共 {len(merged)} 条跑步记录")


if __name__ == "__main__":
    main()
