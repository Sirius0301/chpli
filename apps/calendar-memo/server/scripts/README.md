# 数据库修复脚本

## migrate-memo-completions.ts

为已存在的已完成备忘录生成完成记录。

### 背景

在添加 `MemoCompletion` 表之前，重复备忘录的完成状态是全局的（所有实例共享同一个状态）。新系统允许每个重复实例有独立的完成状态。

此脚本用于迁移旧数据：
- 对于已完成的非重复备忘录：创建一个完成记录
- 对于已完成的重复备忘录：创建从开始日期到 updatedAt 之间的所有实例的完成记录

### 处理逻辑

#### 非重复备忘录 (repeatType = 'NONE')
```
备忘录: 2024-03-01 完成
↓
创建 1 个 completion 记录:
  - instanceDate: 2024-03-01
  - completed: true
```

#### 重复备忘录 (repeatType != 'NONE')
```
备忘录: 从 2024-03-01 开始每天重复，2024-03-05 标记完成
↓
创建 5 个 completion 记录:
  - 2024-03-01: completed
  - 2024-03-02: completed
  - 2024-03-03: completed
  - 2024-03-04: completed
  - 2024-03-05: completed
```

支持的重复规则：
- `DAILY` - 每天
- `WEEKLY` - 每周
- `BIWEEKLY` - 每两周
- `MONTHLY` - 每月
- `QUARTERLY` - 每季度
- `SEMIANNUAL` - 每半年
- `YEARLY` - 每年

### 运行方式

#### 方式1：使用 Docker Compose（推荐）

```bash
# 启动数据库（如果还没启动）
docker-compose up -d postgres

# 运行迁移服务（生产环境）
docker-compose --profile migrate up db-migrate

# 或开发环境
docker-compose -f docker-compose.dev.yml --profile migrate up db-migrate
```

#### 方式2：使用 pnpm 脚本（本地开发）

```bash
cd apps/calendar-memo/server
pnpm migrate:completions
```

#### 方式3：直接使用 tsx

```bash
cd apps/calendar-memo/server
npx tsx scripts/migrate-memo-completions.ts
```

#### 方式4：使用 SQL 脚本（仅非重复备忘录）

```bash
cd apps/calendar-memo/server
./scripts/run-sql-migration.sh
```

或在 Docker 中：
```bash
docker exec -i chpli-postgres psql -U chpli -d chpli < scripts/migrate-memo-completions.sql
```

### 注意事项

- 脚本会跳过已有 completion 记录的备忘录（避免重复创建）
- 对于重复备忘录，只有 `updatedAt` 日期及之前的实例会被标记为完成
- 如果设置了 `repeatEndDate`，则不会超过该日期
- 可以安全地多次运行（幂等性）
- 此脚本不会删除或修改任何现有数据，只会添加新的 completion 记录

### Docker Compose 集成说明

在 `docker-compose.yml` 和 `docker-compose.dev.yml` 中添加了 `db-migrate` 服务：

```yaml
db-migrate:
  image: node:20-alpine
  # ...
  profiles:
    - migrate  # 使用 profiles 避免默认启动
  restart: "no"  # 只运行一次
```

使用 `profiles` 特性确保迁移服务不会随其他服务自动启动，需要显式指定 `--profile migrate` 才会运行。

### 完整部署流程

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 等待数据库就绪
sleep 5

# 3. 运行数据迁移（如有需要）
docker-compose --profile migrate up db-migrate

# 4. 启动应用服务
docker-compose up -d
```

### 测试验证

运行测试脚本验证迁移逻辑：

```bash
cd apps/calendar-memo/server
npx tsx scripts/test-migration-logic.ts
```

测试覆盖：
- ✅ 非重复备忘录
- ✅ 每天重复
- ✅ 每周重复
- ✅ 每月重复
- ✅ 每两周重复
- ✅ 每年重复
- ✅ 有结束日期限制的重复
