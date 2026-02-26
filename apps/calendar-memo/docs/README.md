# Calendar Memo 文档

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [API.md](./API.md) | 完整的后端 API 接口文档 |
| [DATABASE.md](./DATABASE.md) | PostgreSQL + Prisma 数据库设计 |
| [ENV.md](./ENV.md) | 环境变量配置说明 |
| [FRONTEND.md](./FRONTEND.md) | 前端开发指南 |

## 🚀 快速开始

### 1. 启动 PostgreSQL

```bash
docker-compose up -d postgres
```

### 2. 初始化数据库

```bash
cd apps/calendar-memo/server
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 3. 启动服务

```bash
pnpm dev
```

## 🔐 默认账号

```
Email: cici@example.com
Password: ILoveYou
```

## 🗄️ 数据库

- **类型**: PostgreSQL 16 (Docker)
- **ORM**: Prisma
- **连接**: `postgresql://chpli:chpli_secret@localhost:5432/chpli`
