# Chpli

Chpli 是一个个人生产力工具 Monorepo，包含日历备忘录等多个应用。

## 🏗️ 项目结构

```
chpli/
├── apps/                          # 所有应用
│   └── calendar-memo/             # 日历备忘录应用
│       ├── apps/
│       │   ├── web/               # React 前端 (@chpli/calendar-memo-web)
│       │   └── server/            # Express 后端 (@chpli/calendar-memo-server)
│       └── shared/                # 共享类型 (@chpli/calendar-memo-shared)
├── packages/                      # 共享包（未来扩展）
├── infra/                         # 基础设施配置
│   └── postgres/                  # PostgreSQL 配置
├── docker-compose.yml             # Docker Compose 配置
├── package.json                   # 根 package.json
└── pnpm-workspace.yaml            # pnpm workspace 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose (可选)

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动所有应用
cd apps/calendar-memo
pnpm dev

# 或者从根目录
pnpm dev:calendar
```

### 使用 Docker

```bash
# 启动 PostgreSQL
cp .env.example .env
pnpm db:up

# 启动所有服务
docker-compose up -d
```

## 📦 应用列表

| 应用 | 包名 | 端口 | 描述 |
|------|------|------|------|
| Calendar Memo Web | @chpli/calendar-memo-web | 5173 | 日历备忘录前端 |
| Calendar Memo Server | @chpli/calendar-memo-server | 3001 | 日历备忘录后端 |

## 🛠️ 技术栈

- **前端**: React + TypeScript + Vite + TailwindCSS + Zustand
- **后端**: Express + TypeScript + better-sqlite3
- **数据库**: SQLite (当前) / PostgreSQL (迁移中)
- **部署**: Docker + Docker Compose

## 📝 开发指南

### 添加新应用

1. 在 `apps/` 目录下创建新应用目录
2. 使用 `@chpli/<app-name>` 作为包名
3. 在 `pnpm-workspace.yaml` 中添加路径
4. 更新根目录 `package.json` 的 scripts

### 共享包

共享包放在 `packages/` 目录或应用内的 `shared/` 目录：

```typescript
// 引用共享类型
import type { Memo } from '@chpli/calendar-memo-shared';
```

## 📄 许可证

MIT
