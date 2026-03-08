# 数据迁移指南

如果 Docker 方式运行迁移遇到问题，请使用以下方法：

## 方法1: 在宿主机上直接运行（推荐）

```bash
# 1. 确保数据库已启动
docker-compose up -d postgres

# 2. 运行迁移脚本
./migrate.sh
```

## 方法2: 手动执行

```bash
# 1. 确保数据库已启动
docker-compose up -d postgres

# 2. 进入 server 目录
cd apps/calendar-memo/server

# 3. 安装依赖
pnpm install

# 4. 生成 Prisma Client
npx prisma generate

# 5. 运行迁移
npx tsx scripts/migrate-memo-completions.ts
```

## 方法3: Docker 方式（如果可用）

```bash
# 删除旧容器（如果有）
docker-compose rm -f db-migrate

# 运行迁移
docker-compose --profile migrate up db-migrate
```

## 常见问题

### 问题: "Prisma schema 找不到"

**解决**: 确保在 `apps/calendar-memo/server` 目录下运行命令。

### 问题: "Cannot find module '@prisma/client'"

**解决**: 先运行 `pnpm install` 安装依赖。

### 问题: "DATABASE_URL 环境变量未设置"

**解决**: 确保 `.env` 文件存在并且包含 DATABASE_URL。

```bash
# 检查 .env 文件
cat apps/calendar-memo/server/.env | grep DATABASE_URL
```

## 验证迁移结果

```bash
# 查看数据库中的 completion 记录数量
docker exec chpli-postgres psql -U chpli -d chpli -c "SELECT COUNT(*) FROM memo_completions;"

# 查看具体记录
docker exec chpli-postgres psql -U chpli -d chpli -c "SELECT * FROM memo_completions LIMIT 10;"
```
