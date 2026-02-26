# Calendar Memo

个人日历备忘录系统，支持重复提醒、标签分类、优先级管理、用户认证等功能。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### 1. 启动 PostgreSQL

```bash
# 从项目根目录启动 PostgreSQL
docker-compose up -d postgres

# 或使用 pnpm 快捷命令
pnpm db:up
```

### 2. 配置环境变量

```bash
cd apps/calendar-memo/server
cp .env.example .env

# 编辑 .env（默认配置已适合本地开发）
```

### 3. 数据库初始化

```bash
cd apps/calendar-memo/server

# 生成 Prisma Client
pnpm db:generate

# 推送数据库结构
pnpm db:push

# 生成测试数据（用户: cici / 密码: ILoveYou）
pnpm db:seed
```

### 4. 启动开发服务器

```bash
# 启动前后端（从 calendar-memo 目录）
cd apps/calendar-memo
pnpm dev

# 或单独启动
pnpm dev:web      # 前端: http://localhost:5173
pnpm dev:server   # 后端: http://localhost:3001
```

## 📁 目录结构

```
calendar-memo/
├── apps/
│   ├── web/                # React 前端
│   └── server/             # Express + Prisma 后端
│       ├── src/
│       │   ├── routes/     # API 路由
│       │   ├── db/         # Prisma 客户端
│       │   └── index.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── scripts/
│           └── db-seed.ts  # 数据种子
└── shared/                 # 共享类型
```

## 🗄️ 数据库

### 技术栈

- **数据库**: PostgreSQL 16
- **ORM**: Prisma
- **运行方式**: Docker Compose

### 常用命令

```bash
# 启动 PostgreSQL
docker-compose up -d postgres

# 生成 Prisma Client
pnpm db:generate

# 推送结构变更（开发）
pnpm db:push

# 创建迁移（生产）
pnpm db:migrate

# 打开 Prisma Studio
pnpm db:studio

# 生成测试数据
pnpm db:seed

# 重置数据库
pnpm db:reset
```

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite + TailwindCSS
- Zustand 状态管理
- date-fns + lunar-javascript

### 后端
- Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT 认证 + bcrypt
- Zod 参数校验

## 🔐 默认测试账号

```
Email: cici@example.com
Password: ILoveYou
```

运行 `pnpm db:seed` 后自动生成。

## 📝 文档

- [API 文档](./docs/API.md)
- [数据库设计](./docs/DATABASE.md)
- [环境变量](./docs/ENV.md)
