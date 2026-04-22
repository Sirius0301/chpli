# Chpli Monorepo

> 个人生产力套件 — 统一入口、日历备忘录、书签管理

## 项目概述

Chpli 是一个基于 pnpm workspace 的 monorepo 项目，包含多个个人生产力应用：

| 应用 | 路径 | 说明 |
|------|------|------|
| **Portal** | `apps/portal/web` | 统一入口前端，单点登录，iframe 集成子应用 |
| **Calendar Memo** | `apps/calendar-memo` | 日历备忘录（Web + Server），支持重复提醒、标签、完成追踪 |
| **Bookmark Manager** | `apps/bookmark-manager` | 书签管理（Web + Server），支持标签分类、回收站、导入导出 |
| **User Manager** | `apps/user-manager/server` | 统一用户认证服务，JWT 签发与验证 |

## 技术架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Portal Web │     │ Calendar Web│     │ Bookmark Web│
│  (React+Vite)     │  (React+Vite)     │  (React+Vite)
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│ User Manager│     │ Calendar    │     │ Bookmark    │
│ (Express)   │     │ Server      │     │ Server      │
│ Port 3002   │     │ (Express)   │     │ (FastAPI)   │
└──────┬──────┘     │ Port 3001   │     │ Port 8001   │
       │            └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │   Port 5432 │
                    └─────────────┘
```

| 层级 | 技术栈 |
|------|--------|
| **前端** | React 18 + TypeScript + Vite + TailwindCSS + react-router-dom |
| **前端状态** | Zustand (Calendar), React Query (Bookmark), Context (Portal Auth) |
| **Node 后端** | Express 4 + Prisma 5 + PostgreSQL |
| **Python 后端** | FastAPI + SQLAlchemy (async) + Alembic + PostgreSQL |
| **认证** | JWT (jsonwebtoken) + bcryptjs，共享 `@chpli/auth-shared` |
| **部署** | Docker Compose + Caddy 反向代理 |
| **包管理** | pnpm 10 Workspaces |

## 数据库表结构

| 表名 | 归属服务 | 说明 |
|------|---------|------|
| `um_users` | User Manager | 统一用户表（邮箱、手机号、密码） |
| `cm_memos` | Calendar Memo | 备忘录主表 |
| `cm_tags` | Calendar Memo | 备忘录标签表 |
| `_MemoToTag` | Calendar Memo | Prisma 隐式多对多关联表（`cm_memos` ↔ `cm_tags`） |
| `cm_users` | Calendar Memo | 已弃用（保留历史数据，统一使用 `um_users`） |
| `bm_bookmarks` | Bookmark Manager | 书签主表 |
| `bm_tags` | Bookmark Manager | 书签标签表 |
| `bm_bookmark_tags` | Bookmark Manager | SQLAlchemy 多对多关联表（`bm_bookmarks` ↔ `bm_tags`） |
| `bm_user_clicks` | Bookmark Manager | 用户点击记录表 |
| `alembic_version` | Bookmark Manager | Alembic 数据库迁移版本控制表 |

> 所有服务共享同一个 PostgreSQL 数据库，通过表前缀区分：`um_`（User Manager）、`cm_`（Calendar Memo）、`bm_`（Bookmark Manager）。`_MemoToTag` 和 `alembic_version` 为 ORM/迁移框架自动生成的系统表。

## 项目结构

```
.
├── apps/
│   ├── bookmark-manager/
│   │   ├── server/          # FastAPI + Alembic + asyncpg
│   │   └── web/             # React + Vite + React Query
│   ├── calendar-memo/
│   │   ├── server/          # Express + Prisma
│   │   ├── web/             # React + Vite + Zustand
│   │   └── shared/          # 共享类型定义
│   ├── portal/
│   │   └── web/             # 统一入口 React 应用
│   └── user-manager/
│       └── server/          # 统一认证 Express 服务
├── packages/
│   └── auth-shared/         # JWT 工具 + Express 认证中间件
├── scripts/
│   ├── start-local.sh       # 本地一键启动所有服务
│   ├── stop-local.sh        # 停止所有服务
│   ├── logs.sh              # 查看服务日志
│   └── seed.sh              # 填充测试数据
├── docker-compose.yml       # 生产/完整部署
├── docker-compose.dev.yml   # 开发环境容器化
├── Caddyfile                # 反向代理配置
└── mermaid.md               # 系统架构图（C4 + 序列图）
```

## 快速开始

### 方式一：本地脚本（推荐日常开发）

依赖：Docker、pnpm、Python 3.12+

```bash
# 1. 安装依赖
pnpm install

# 2. 一键启动所有服务（PostgreSQL + 3个后端 + 3个前端）
./scripts/start-local.sh

# 3. 填充测试数据
./scripts/seed.sh
```

启动后会显示所有服务的访问地址：
- Portal（统一入口）: http://localhost:5173
- Calendar Memo: http://localhost:5175
- Bookmark Manager: http://localhost:5174

**常用命令：**
```bash
# 停止所有服务
./scripts/stop-local.sh

# 查看日志
./scripts/logs.sh -a          # 跟踪所有
./scripts/logs.sh -s          # 查看状态
./scripts/logs.sh user-manager # 单个服务

# 只启动数据库
./scripts/start-local.sh db
```

### 方式二：Docker Compose（环境一致性）

```bash
# 1. 创建环境变量
cp .env.example .env

# 2. 启动全部服务
docker-compose -f docker-compose.dev.yml up -d

# 3. 填充测试数据
./scripts/seed.sh
```

### 方式三：单独启动某个应用

```bash
# 启动 PostgreSQL
docker-compose up -d postgres

# Calendar Memo（前后端）
pnpm run dev:calendar

# User Manager（仅后端）
pnpm run dev:user-manager

# Portal（仅前端）
pnpm run dev:portal
```

## 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://chpli:chpli_secret@localhost:5432/chpli` |
| `JWT_SECRET` | JWT 签名密钥（生产必须修改） | `your-super-secret-jwt-key...` |
| `USER_MANAGER_PORT` | 认证服务端口 | 3002 |
| `CALENDAR_MEMO_SERVER_PORT` | Calendar 后端端口 | 3001 |
| `BOOKMARK_MANAGER_SERVER_PORT` | Bookmark 后端端口 | 8001 |
| `PORTAL_WEB_PORT` | Portal 前端端口 | 5173 |
| `CALENDAR_MEMO_WEB_PORT` | Calendar 前端端口 | 5175 |
| `BOOKMARK_MANAGER_WEB_PORT` | Bookmark 前端端口 | 5174 |

> 生产环境必须修改 `JWT_SECRET`，建议使用 `openssl rand -base64 32` 生成。

## 测试账号

运行 `./scripts/seed.sh` 后会生成以下测试账号：

| 账号 | 密码 |
|------|------|
| `test@example.com` | `Test123!@#` |

## 端口速查

| 服务 | 端口 | 说明 |
|------|------|------|
| Portal Web | 5173 | 统一入口 |
| Calendar Memo Web | 5175 | 日历前端 |
| Bookmark Web | 5174 | 书签前端 |
| User Manager API | 3002 | 认证服务 `/api/auth/*` |
| Calendar Memo API | 3001 | 备忘录服务 `/api/memos/*` |
| Bookmark API | 8001 | 书签服务 `/api/v1/*` |
| PostgreSQL | 5432 | 数据库 |

## 开发指南

### 添加新应用

1. 在 `apps/` 下创建目录
2. 在 `pnpm-workspace.yaml` 中添加包路径
3. 运行 `pnpm install` 安装依赖

### 数据库操作

```bash
# Calendar Memo
cd apps/calendar-memo/server
npx prisma generate      # 生成 Prisma Client
npx prisma db push       # 同步 schema 到数据库（开发环境）
npx prisma studio        # 可视化数据管理

# User Manager
cd apps/user-manager/server
npx prisma generate
npx prisma db push

# Bookmark Manager
cd apps/bookmark-manager/server
alembic upgrade head      # 应用迁移
alembic revision --autogenerate -m "desc"  # 创建新迁移
```

> ⚠️ **注意**：User Manager 和 Calendar Memo 共享同一个 PostgreSQL 数据库，但使用不同的表前缀（`um_` / `cm_`）。初始化时通过合并 schema 一次性 push，避免 `prisma db push` 互相删除对方表。

### 认证流程

1. 用户通过 Portal 登录 → User Manager 签发 JWT
2. Portal 通过 `postMessage` 向 iframe 子应用传递 Token
3. 各后端通过 `@chpli/auth-shared` 中的 `authMiddleware` 离线验证 JWT

### 验证码服务（本地 Mock）

开发环境已内置 mock：
- `POST /api/auth/send-code` 在 `NODE_ENV=development` 时直接返回 `code` 字段
- 前端自动填充验证码，无需真实短信/邮件

生产环境配置腾讯云 SES/SMS：
```bash
TENCENT_SECRET_ID=xxx
TENCENT_SECRET_KEY=xxx
SMS_SIGN_NAME=xxx
SMS_TEMPLATE_ID=xxx
SES_FROM_EMAIL=xxx
```

## 部署

```bash
# 生产部署（Caddy + 所有服务）
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

## 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 架构图 | [mermaid.md](./mermaid.md) | C4 上下文/容器/组件图 + 交互序列图 |
| Calendar Memo 教程 | [apps/calendar-memo/TUTORIAL.md](./apps/calendar-memo/TUTORIAL.md) | 全栈开发学习教程 |
| 数据迁移 | [MIGRATE.md](./MIGRATE.md) | memo completions 迁移指南 |
| 国际化 | [apps/calendar-memo/web/I18N_GUIDE.md](./apps/calendar-memo/web/I18N_GUIDE.md) | i18n 实现指南 |
| Bookmark 迁移 | [apps/bookmark-manager/server/README.md](./apps/bookmark-manager/server/README.md) | Alembic 使用说明 |
| 测试数据 | [apps/calendar-memo/server/scripts/TEST_DATA_GUIDE.md](./apps/calendar-memo/server/scripts/TEST_DATA_GUIDE.md) | Calendar Memo 测试场景 |

## License

MIT
