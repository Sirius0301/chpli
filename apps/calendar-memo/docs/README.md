# Calendar Memo 文档

欢迎来到 Calendar Memo 开发文档！

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [API.md](./API.md) | 完整的后端 API 接口文档 |
| [DATABASE.md](./DATABASE.md) | Prisma 数据库模型设计 |
| [ENV.md](./ENV.md) | 环境变量配置说明 |
| [FRONTEND.md](./FRONTEND.md) | 前端开发指南 |

## 🎯 快速开始

### 1. 环境准备

```bash
# 确保安装了 Node.js 和 pnpm
node -v  # >= 18.0.0
pnpm -v  # >= 9.0.0
```

### 2. 安装依赖

```bash
# 从项目根目录
pnpm install

# 或进入应用目录
cd apps/calendar-memo
```

### 3. 配置环境变量

```bash
# 复制环境变量示例
cp server/.env.example server/.env

# 编辑配置（至少修改 JWT_SECRET）
vim server/.env
```

### 4. 初始化数据库

```bash
cd server

# 生成 Prisma Client
pnpm db:generate

# 推送数据库结构
pnpm db:push
```

### 5. 启动开发服务器

```bash
# 启动前后端（推荐）
pnpm dev

# 或单独启动
cd apps/calendar-memo
pnpm dev:web      # 前端: http://localhost:5173
pnpm dev:server   # 后端: http://localhost:3001
```

## 🏗️ 项目架构

```
calendar-memo/
├── apps/
│   ├── web/           # React 前端
│   └── server/        # Express + Prisma 后端
├── shared/            # 共享类型
└── docs/              # 开发文档
    ├── API.md
    ├── DATABASE.md
    ├── ENV.md
    └── FRONTEND.md
```

## 🔐 认证模块

本应用已集成完整的用户认证系统：

- ✅ 邮箱/手机号 + 密码登录
- ✅ JWT Token 认证
- ✅ 验证码注册/找回密码/修改密码
- ✅ 密码强度校验（8位+中英文/数字/特殊字符）
- ✅ bcrypt 加密（cost=12）

详见 [API.md](./API.md) 认证模块部分。

## 📦 技术栈

### 前端
- React 18 + TypeScript
- Vite（构建工具）
- TailwindCSS（样式）
- Zustand（状态管理）
- date-fns + lunar-javascript（日期处理）

### 后端
- Express + TypeScript
- Prisma ORM
- PostgreSQL（数据库）
- bcrypt（密码加密）
- JWT（认证）
- Zod（参数校验）

## 🐳 Docker 部署

```bash
# 从项目根目录
docker-compose up -d

# 服务地址：
# - Web: http://localhost:5173
# - API: http://localhost:3001
# - DB: localhost:5432
```

## 🤝 开发规范

### 代码提交

```bash
# 类型: 描述
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复标签筛选逻辑"
git commit -m "docs: 更新 API 文档"
```

类型说明：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 分支管理

- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

## 📞 问题反馈

如有问题，请在项目仓库提交 Issue。
