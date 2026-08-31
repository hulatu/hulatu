#!/usr/bin/env python3
"""在本地登录 Garmin Connect，生成登录令牌，供 GitHub Actions 使用。

用法（在本机执行，不要在 GitHub 上执行）：
    pip install --upgrade garminconnect
    GARMIN_EMAIL=你的邮箱 GARMIN_PASSWORD=你的密码 python3 scripts/garmin-token.py

如果账号开了两步验证，加一个当前验证码：
    GARMIN_MFA_CODE=当前验证码 python3 scripts/garmin-token.py

执行成功后会把一串很长的 base64 令牌打印出来（形如 eyJvYXV0...），
把它复制到 GitHub 仓库的 Settings → Secrets and variables → Actions，
新建一个名为 GARMINTOKENS 的 Secret 粘贴进去即可。

令牌等同于你的登录凭证，只放进 GitHub Secret，不要发到公开场合。
令牌过期后重新跑一次本脚本即可。
"""

from __future__ import annotations

import base64
import os
import sys
from pathlib import Path


def mfa_code() -> str:
    code = os.environ.get("GARMIN_MFA_CODE", "").strip()
    if not code:
        raise RuntimeError("账号开启了双重验证，请把当前验证码填入 GARMIN_MFA_CODE 后重试")
    return code


def dump_token(client) -> str:
    """尝试多种方式导出令牌字符串。"""
    candidates: list[str] = []

    try:
        import garth

        candidates.append(garth.dumps())
    except Exception:
        pass

    try:
        candidates.append(client.garth.dumps())
    except Exception:
        pass

    # 兜底：登录成功后 garminconnect 会把令牌存到本地文件，直接读取并 base64
    home = Path.home()
    for rel in (
        ".garminconnect/garmin_tokens.json",
        ".garminconnect/tokens.json",
        ".garminconnect",
    ):
        path = home / rel
        if not path.exists():
            continue
        files = [path] if path.is_file() else [path / f for f in ("garmin_tokens.json", "tokens.json")]
        for f in files:
            if f.exists():
                candidates.append(base64.b64encode(f.read_bytes()).decode())
        break

    for token in candidates:
        if token and len(token) > 512:
            return token
    sys.exit("未能导出令牌：请确认 garminconnect 已安装且登录成功（pip show garminconnect）")


def main() -> None:
    email = os.environ.get("GARMIN_EMAIL", "").strip()
    password = os.environ.get("GARMIN_PASSWORD", "")
    if not email or not password:
        sys.exit("缺少 GARMIN_EMAIL 或 GARMIN_PASSWORD 环境变量。")

    try:
        from garminconnect import Garmin
    except ImportError:
        sys.exit("未安装 garminconnect，请先执行：pip install --upgrade garminconnect")

    try:
        client = Garmin(email=email, password=password, prompt_mfa=mfa_code)
        client.login()
    except Exception as exc:
        sys.exit(f"Garmin 登录失败：{exc}")

    token = dump_token(client)
    print(token)
    print()
    print("把上面这一整串复制到 GitHub Secret：GARMINTOKENS")


if __name__ == "__main__":
    main()
