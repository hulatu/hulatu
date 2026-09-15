# 胡拉图个人数字花园施工手册

> 目标不是“彻底去中心化”，而是让域名、Markdown、数据和备份真正属于自己；微信、知乎、小红书、少数派只是分发渠道。

## 0. 当前资产

| 资产 | 现状 | 定位 |
|---|---|---|
| `hulatu.com` | 已有 | 数字身份和入口 |
| Hugo + Markdown | 已有 | 内容原件 |
| Git / GitHub | 已有 | 版本控制 + 异地副本 |
| Cloudflare Pages / DNS / R2 | 已有 | 托管和媒体仓库 |
| Giscus | 已有 | 轻量评论层 |
| RSS | 已有，且已全量输出 | 主动信息入口 |
| Garmin → `data/runs.json` | 已有 | 运动数据同步 |

## 1. 第一阶段：先把数据掌握权建立起来

### 内容源

以后固定为：

```text
Typora → Markdown → Git → Hugo → hulatu.com
```

所有平台发布的内容都只是副本，原始文件永远在：

```text
content/
```

### 备份

仓库现在内置了一个备份脚本：

```bash
bash scripts/backup-blog.sh
```

默认备份到：

```text
~/Backups/hulatu-blog/
```

如果要备份到外置 SSD 或指定目录：

```bash
BACKUP_DEST="/Volumes/SSD/hulatu-blog" bash scripts/backup-blog.sh
```

脚本会生成两种文件：

- `hulatu-blog-content-*.tar.gz`：内容、模板、样式、脚本、配置快照。
- `hulatu-blog-git-*.bundle`：完整的 Git 历史和分支。

建议至少做到 3-2-1：

```text
Mac 原稿
  ├── GitHub（异地副本）
  ├── 外置 SSD（离线副本）
  └── 云备份（例如 iCloud / 其他对象存储）
```

### 第一阶段检查清单

- [x] 博客源码使用 Markdown + Git
- [x] RSS 已全量输出
- [ ] 运行一次 `scripts/backup-blog.sh`
- [ ] 在外置 SSD 放一份备份
- [ ] 在云备份中保留一份备份
- [ ] 记录域名注册商、Cloudflare、GitHub 的恢复信息

## 2. 第二阶段：把域名变成数字家

先在同域名下用路径实现，后续再按需要映射成子域名：

| 房间 | 当前路径 / 建议子域名 | 用途 | 状态 |
|---|---|---|---|
| 主页 | `hulatu.com` | 数字之家 | 现有博客首页 |
| 文章 | `/posts/` 或 `blog.hulatu.com` | 长文章 | 已有 |
| 周刊 | `/weekly/` | 周刊 | 已有 |
| 笔记 | `/notes/` 或 `notes.hulatu.com` | 50–300 字短笔记 | 本次已加 |
| 此刻 | `/now/` 或 `now.hulatu.com` | 当前在做的事 | 本次已加 |
| 经验 | `/experience/` | 可讨论的经验数据库 | 待建 |
| 实验室 | `/lab/` | 科研、实验、方法 | 待建 |
| 运动 | `run.hulatu.com` | 跑步数据主页 | 本次已加 |
| 文件 | `/files/` | 公开简历、清单、导出文件 | 待建 |
| 媒体 | `img.hulatu.com` | 图片 CDN | 已有 R2 |
| Shot | `shot.hulatu.com` | 朋友圈式图片分享 | 本次已加 |

### 现在怎么用

新建一条短笔记：

```bash
hugo new content/notes/今天把App分成了四类.md
```

编辑 `/content/now.md` 更新“此刻”页面。

## 3. 第三阶段：把平台降级成传播渠道

标准流程：

```text
hulatu.com/posts/xxx/
        │
        ├── 公众号
        ├── 知乎
        ├── 少数派
        └── 小红书
```

平台文章只保留“原文链接 + 精炼改写”，不把完整原始内容交给单一平台。

## 4. 第四阶段：建立个人数据系统

Garmin 数据最终链路：

```text
Garmin 255
  → Garmin Connect
  → FIT / GPX / CSV 原始导出
  → Mac 本地目录
  → data/runs.json
  → hulatu.com/running
```

当前 `scripts/sync-garmin.py` 只同步跑步摘要；原始 FIT/GPX/CSV 需要从 Garmin Connect 定期手工导出并纳入备份目录。

## 5. 第五阶段：开放网络协议

暂不急着自建，按顺序评估：

1. RSS 全量输出
2. Webmention
3. ActivityPub / Fediverse
4. 独立站点成为内容源

## 6. 核心依赖等级

| 等级 | 内容 | 原则 |
|---|---|---|
| S | 域名、Markdown、Git 仓库、照片原件、密码与恢复密钥 | 绝对掌握 |
| A | Hugo、R2、网站结构、邮箱地址、RSS、运动原始数据 | 强掌握 |
| B | GitHub、Cloudflare、Gmail、Giscus、Garmin Connect | 可替换 |
| C | 微信公众号、知乎、少数派、小红书、即刻 | 纯渠道 |

真正的数字主权不是“不用中心化服务”，而是“随时可以离开”。
