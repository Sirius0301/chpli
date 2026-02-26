# Calendar Memo

个人日历备忘录系统，支持重复提醒、标签分类、优先级管理、用户认证等功能。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 14（或 Docker）

### 安装依赖

```bash
# 从根目录安装
pnpm install

# 或进入应用目录
cd apps/calendar-memo
pnpm install
```

### 环境配置

```bash
# 复制环境变量示例
cp server/.env.example server/.env

# 编辑 .env 文件，配置数据库和 JWT 密钥
```

### 数据库初始化

```bash
cd apps/calendar-memo/server

# 生成 Prisma Client
pnpm db:generate

# 推送数据库结构（开发环境）
pnpm db:push

# 或执行迁移（生产环境）
pnpm db:migrate

# 数据迁移（标签私有化）
pnpm db:migrate-tags
```

#### 标签私有化迁移

如果是从旧版本升级，需要执行标签私有化迁移：

```bash
# 该脚本会：
# 1. 为无 userId 的标签根据关联备忘录推断归属
# 2. 合并同用户的同名标签
# 3. 删除无关联的空标签
pnpm db:migrate-tags
```

### 开发模式

```bash
# 启动开发服务器（前端 + 后端）
pnpm dev

# 单独启动前端
pnpm dev:web

# 单独启动后端
pnpm dev:server
```

### 生产构建

```bash
# 构建前端
pnpm --filter @chpli/calendar-memo-web build

# 构建后端
pnpm --filter @chpli/calendar-memo-server build

# 启动生产服务器
pnpm start
```

## 📁 目录结构

```
calendar-memo/
├── apps/
│   ├── web/                # React 前端 (@chpli/calendar-memo-web)
│   │   ├── src/
│   │   │   ├── components/ # React 组件
│   │   │   ├── stores/     # Zustand 状态管理
│   │   │   └── utils/      # 工具函数
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   │
│   └── server/             # Express 后端 (@chpli/calendar-memo-server)
│       ├── src/
│       │   ├── routes/     # API 路由
│       │   │   ├── auth.ts       # 认证模块
│       │   │   ├── memoes.ts     # 备忘录 CRUD
│       │   │   ├── tags.ts       # 标签管理
│       │   │   └── upload.ts     # 文件上传
│       │   ├── lib/
│       │   │   └── prisma.ts     # Prisma Client
│       │   └── index.ts
│       ├── prisma/
│       │   └── schema.prisma     # 数据库模型
│       └── Dockerfile
│
└── shared/                 # 共享类型 (@chpli/calendar-memo-shared)
    └── types/
        └── index.ts
```

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: TailwindCSS
- **状态**: Zustand
- **日期**: date-fns + lunar-javascript
- **HTTP**: Axios

### 后端
- **框架**: Express + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + bcrypt
- **验证**: Zod

### 特色功能
- 🔐 用户认证（邮箱/手机 + 密码）
- 📅 农历日期显示
- 🔄 多种重复规则（天、周、双周、月、季度、半年、年）
- 🏷️ 标签筛选（AND 逻辑）
- ⚡ 优先级管理
- 🖼️ 图片上传

## 📚 开发文档

- [API 文档](./docs/API.md) - 完整的接口文档
- [数据库设计](./docs/DATABASE.md) - Prisma 模型说明
- [环境变量](./docs/ENV.md) - 配置项说明

## 🐳 Docker 部署

```bash
# 从项目根目录启动所有服务
docker-compose up -d

# 服务将运行在：
# - Web: http://localhost:5173
# - API: http://localhost:3001
# - PostgreSQL: localhost:5432
```

## 🔒 认证说明

本系统支持双因素登录：
1. **登录凭证**: 邮箱或手机号 + 密码
2. **敏感操作**: 需要验证码（注册、找回密码、修改密码）

密码策略：
- 长度 ≥ 8 位
- 必须包含中文或英文字符
- 必须包含数字
- 必须包含特殊字符（如 `!@#$`）
- 使用 bcrypt 加密（cost=12）

## 📝 更新日志

### v1.1.0
- 新增用户认证模块
- 从 SQLite 迁移到 PostgreSQL
- 添加 Prisma ORM

### v1.0.0
- 基础日历备忘录功能
- 标签系统
- 重复规则
- 图片上传
