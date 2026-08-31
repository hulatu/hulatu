#!/usr/bin/env python3
"""在本地登录 Garmin Connect，生成登录令牌，供 GitHub Actions 使用。

用法（在本机执行，不要在 GitHub 上执行）：
    pip install --upgrade garminconnect
    python3 scripts/garmin-token.py

运行后会按提示输入邮箱、密码（密码不显示）。如果账号开了两步验证，
登录时会再提示输入验证码（看 Garmin 发到邮箱/验证器 App 的 6 位数字）。

执行成功后会把一串很长的 base64 令牌打印出来（形如 eyJvYXV0...），
把它复制到 GitHub 仓库的 Settings → Secrets and variables → Actions，
新建一个名为 GARMINTOKENS 的 Secret 粘贴进去即可。
令牌会同时保存在本机 ~/.garminconnect/garmin_tokens.json。

令牌等同于你的登录凭证，只放进 GitHub Secret，不要发到公开场合。
令牌过期后重新跑一次本脚本即可。

环境变量（可选）：
    GARMIN_REGION     设为 cn 表示中国区账号（garmin.cn），默认全球版
    GARMIN_MFA_CODE   两步验证码，不设则登录时交互输入
"""

from __future__ import annotations

import base64
import getpass
import os
import sys
from pathlib import Path


def mfa_code() -> str:
    code = os.environ.get("GARMIN_MFA_CODE", "").strip()
    if not code:
        code = input("两步验证码（Garmin 发到邮箱/验证器 App，30-60 秒有效）: ").strip()
    if not code:
        raise RuntimeError("未输入验证码")
    return code


def dump_token(client, token_dir: Path) -> str:
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

    # 新版 garminconnect（0.2.40+）把令牌存成 ~/.garminconnect/garmin_tokens.json
    if token_dir.is_dir():
        for f in sorted(token_dir.iterdir()):
            if f.is_file() and ("token" in f.name.lower() or f.name == "garmin_tokens.json"):
                candidates.append(base64.b64encode(f.read_bytes()).decode())

    for token in candidates:
        if token:
            return token
    sys.exit("未能导出令牌：请确认 garminconnect 已安装且登录成功（pip show garminconnect）")


def main() -> None:
    email = os.environ.get("GARMIN_EMAIL", "").strip()
    password = os.environ.get("GARMIN_PASSWORD", "")
    is_cn = os.environ.get("GARMIN_REGION", "").strip().lower() == "cn"
    token_dir = Path.home() / ".garminconnect"
    if not email:
        email = input("Garmin 账号邮箱: ").strip()
    # 容错：去掉手误输入或从命令行复制的反斜杠（\@ 转义残留）
    email = email.replace("\\", "").strip()
    if not password:
        password = getpass.getpass("Garmin 密码（输入时不显示）: ")
    if not email or not password:
        sys.exit("邮箱或密码不能为空。")

    try:
        from garminconnect import Garmin
    except ImportError:
        sys.exit("未安装 garminconnect，请先执行：pip install --upgrade garminconnect")

    try:
        client = Garmin(email=email, password=password, prompt_mfa=mfa_code, is_cn=is_cn)
        client.login(str(token_dir))
    except Exception as exc:
        sys.exit(f"Garmin 登录失败：{exc}")

    token = dump_token(client, token_dir)
    print(token)
    print()
    print("把上面这一整串复制到 GitHub Secret：GARMINTOKENS")


if __name__ == "__main__":
    main()
