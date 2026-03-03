# Calendar Memo

日历备忘录应用，支持创建、管理和筛选备忘录，包含重复规则和标签系统。

## 快速开始

### 方式一：使用 start.sh 脚本（推荐）

```bash
# 1. 给脚本添加执行权限
chmod +x start.sh stop.sh

# 2. 一键启动所有服务
./start.sh

# 3. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:3001

# 4. 停止服务
./stop.sh
```

### 方式二：手动启动

```bash
# 1. 安装依赖
pnpm install

# 2. 启动数据库
docker-compose up -d postgres

# 3. 初始化数据库
cd apps/calendar-memo/server
npx prisma generate
npx prisma db push --accept-data-loss

# 4. 启动后端（终端1）
pnpm dev

# 5. 启动前端（终端2）
cd apps/calendar-memo/web
pnpm dev
```

访问 http://localhost:5173

### Docker 部署

```bash
# 创建环境变量文件
cp .env.example .env
# 编辑 .env 配置你的数据库密码和JWT密钥

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

访问 http://localhost

---

## 本地开发调试指南

### 常用命令

```bash
# 查看后端日志
tail -f logs/server.log

# 查看数据库
psql postgresql://chpli:chpli_secret@localhost:5432/chpli

# 重启后端
pkill -f "tsx watch"
cd apps/calendar-memo/server && pnpm dev

# 重启前端
# 按 Ctrl+C 停止，然后重新运行 pnpm dev
```

### 端口占用问题

如果遇到 "端口已被占用" 错误：

```bash
# 查找占用 3001 端口的进程
lsof -ti:3001

# 强制结束占用端口的进程
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# 或者使用 stop.sh
./stop.sh
```

### 数据库调试

```bash
# 进入数据库容器
docker exec -it chpli-postgres psql -U chpli -d chpli

# 常用 SQL 查询
\dt                    # 查看所有表
SELECT * FROM users;   # 查看用户
SELECT * FROM memos;   # 查看备忘录
SELECT * FROM tags;    # 查看标签
\q                     # 退出

# 重置数据库（会丢失数据）
docker-compose down -v
docker-compose up -d postgres
```

### 后端调试

```bash
# 查看实时日志
tail -f /tmp/chpli-server.log

# 测试 API
curl http://localhost:3001/api/health

# 带认证的 API 测试
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl http://localhost:3001/api/memos \
  -H "Authorization: Bearer $TOKEN"
```

### 前端调试

```bash
# 浏览器开发者工具
# F12 或 Cmd+Option+I (Mac)

# 查看网络请求
# 在 Network 标签页查看 API 请求

# 查看应用状态
# 在 Console 输入:
JSON.parse(localStorage.getItem('calendar-memo-storage'))
```

### 常见问题

#### 1. 后端启动失败 "EADDRINUSE"

**原因**: 端口 3001 被占用

**解决**:
```bash
lsof -ti:3001 | xargs kill -9
./start.sh
```

#### 2. 数据库连接失败

**原因**: PostgreSQL 未启动或配置错误

**解决**:
```bash
# 检查数据库状态
docker ps | grep postgres

# 重启数据库
docker-compose restart postgres

# 检查环境变量
cat apps/calendar-memo/server/.env
```

#### 3. Prisma Client 未生成

**解决**:
```bash
cd apps/calendar-memo/server
npx prisma generate
```

#### 4. 前端无法连接后端（CORS 错误）

**原因**: 后端 CORS 配置问题

**解决**: 检查后端 `.env` 中的 `CORS_ORIGIN`，确保包含前端地址：
```bash
# apps/calendar-memo/server/.env
CORS_ORIGIN=http://localhost:5173
```

#### 5. 验证码发送失败

**原因**: 开发环境默认不发送真实验证码

**解决**: 直接在数据库插入验证码：
```bash
docker exec chpli-postgres psql -U chpli -d chpli -c "
INSERT INTO verification_codes (id, email, code, type, \"expiresAt\", \"isUsed\", \"createdAt\")
VALUES (gen_random_uuid()::text, 'test@example.com', '123456', 'REGISTER', NOW() + INTERVAL '10 minutes', false, NOW());
"
```

---

## 项目结构

```
.
├── apps/calendar-memo/
│   ├── server/          # 后端 (Express + Prisma)
│   │   ├── src/
│   │   │   ├── routes/      # API 路由
│   │   │   ├── db/prisma.ts # 数据库连接
│   │   │   └── index.ts     # 入口文件
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── Dockerfile
│   ├── web/             # 前端 (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/       # 页面组件
│   │   │   ├── components/  # UI 组件
│   │   │   ├── stores/      # 状态管理
│   │   │   └── utils/       # 工具函数
│   │   └── Dockerfile
│   └── shared/          # 共享类型
├── docker-compose.yml   # 生产环境配置
├── docker-compose.dev.yml # 开发环境配置
├── start.sh             # 本地开发启动脚本
├── stop.sh              # 停止服务脚本
└── .env.example         # 环境变量模板
```

---

## 环境变量

```bash
# 数据库
POSTGRES_USER=chpli
POSTGRES_PASSWORD=your_password
POSTGRES_DB=chpli
DATABASE_URL=postgresql://user:pass@localhost:5432/chpli?schema=public

# JWT
JWT_SECRET=your_jwt_secret

# 前端API地址
VITE_API_URL=http://localhost:3001

# CORS（开发环境设为*允许所有）
CORS_ORIGIN=http://localhost:5173
```

---

## 技术栈

- **后端**: Node.js, Express, Prisma, PostgreSQL
- **前端**: React, TypeScript, Vite, TailwindCSS, Zustand
- **部署**: Docker, Docker Compose

## License

MIT
