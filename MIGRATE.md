# 数据迁移指南

> 针对 Calendar Memo 的 `MemoCompletion` 表迁移（旧系统已完成状态 → 新系统按实例追踪）。

## 何时需要运行

仅当你从 **旧版本（无 MemoCompletion 表）** 升级时，才需要运行此迁移。
全新部署（`prisma db push` + `alembic upgrade head`）无需执行。

## 快速命令

```bash
# 方式1：本地脚本（推荐）
cd apps/calendar-memo/server
pnpm migrate:completions

# 方式2：Docker Compose
docker-compose up -d postgres
docker-compose --profile migrate up db-migrate

# 方式3：直接使用 tsx
cd apps/calendar-memo/server
npx tsx scripts/migrate-memo-completions.ts
```

## 迁移逻辑

### 非重复备忘录（repeatType = 'NONE'）
```
备忘录: 2024-03-01 完成
↓
创建 1 个 completion 记录:
  - instanceDate: 2024-03-01
  - completed: true
```

### 重复备忘录（repeatType != 'NONE'）
```
备忘录: 从 2024-03-01 开始每天重复，2024-03-05 标记完成
↓
创建 5 个 completion 记录（从开始日期到 updatedAt 之间的所有实例）
```

## 安全特性

- **幂等性**：可多次运行，不会重复创建
- **只增不删**：不会修改或删除现有数据
- **事务安全**：使用数据库事务确保一致性

## 回滚

```bash
# 进入数据库容器
docker exec -it chpli-postgres psql -U chpli -d chpli

# 清空 completion 记录
TRUNCATE TABLE cm_memo_completions;

# 或删除特定时间后创建的记录
DELETE FROM cm_memo_completions WHERE "createdAt" > '2024-01-01';
```

## 故障排查

| 问题 | 解决 |
|------|------|
| "Prisma schema 找不到" | 确保在 `apps/calendar-memo/server` 目录下运行 |
| "Cannot find module '@prisma/client'" | 先运行 `pnpm install` |
| "DATABASE_URL 未设置" | 检查 `.env` 文件是否存在 |

## 验证

```bash
# 查看 completion 记录数量
docker exec chpli-postgres psql -U chpli -d chpli -c "SELECT COUNT(*) FROM cm_memo_completions;"

# 查看具体记录
docker exec chpli-postgres psql -U chpli -d chpli -c "SELECT * FROM cm_memo_completions LIMIT 10;"
```

---

## Docker Compose 集成说明

`docker-compose.yml` 和 `docker-compose.dev.yml` 中均包含 `db-migrate` 服务：

```yaml
db-migrate:
  image: node:20-alpine
  profiles:
    - migrate   # 需要显式指定 --profile migrate
  restart: "no" # 只运行一次
```

使用 `profiles` 确保迁移服务不会随其他服务自动启动。
