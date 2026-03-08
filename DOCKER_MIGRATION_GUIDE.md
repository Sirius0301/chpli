# Docker Compose 数据迁移指南

## 概述

已将数据迁移脚本集成到 Docker Compose 配置中，可以通过简单的命令运行。

## 新增内容

### 1. docker-compose.yml & docker-compose.dev.yml

添加了 `db-migrate` 服务：

```yaml
db-migrate:
  image: node:20-alpine
  container_name: chpli-db-migrate
  working_dir: /app/apps/calendar-memo/server
  command: >
    sh -c "
      等待数据库就绪...
      安装依赖...
      生成 Prisma Client...
      运行数据迁移脚本...
    "
  depends_on:
    postgres:
      condition: service_healthy
  profiles:
    - migrate  # 只在指定时运行
  restart: "no"  # 只运行一次
```

### 2. 脚本文件

- `apps/calendar-memo/server/scripts/migrate-memo-completions.ts` - TypeScript 迁移脚本
- `apps/calendar-memo/server/scripts/migrate-memo-completions.sql` - SQL 版本（仅非重复备忘录）
- `apps/calendar-memo/server/scripts/run-sql-migration.sh` - SQL 脚本执行器
- `apps/calendar-memo/server/scripts/README.md` - 使用文档

### 3. package.json

添加了脚本：
```json
"migrate:completions": "tsx scripts/migrate-memo-completions.ts"
```

## 使用方法

### 标准部署流程

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 运行数据迁移（如需迁移旧数据）
docker-compose --profile migrate up db-migrate

# 3. 启动所有服务
docker-compose up -d
```

### 仅运行迁移

```bash
# 确保数据库已启动
docker-compose up -d postgres

# 运行迁移
docker-compose --profile migrate up db-migrate
```

### 开发环境

```bash
# 开发环境同样支持
docker-compose -f docker-compose.dev.yml --profile migrate up db-migrate
```

## 迁移脚本逻辑

### 对于非重复备忘录 (repeatType = 'NONE')
- 创建一个 completion 记录
- `instanceDate = memo.date`

### 对于重复备忘录
1. 计算从 `memo.date` 到 `memo.updatedAt` 之间的所有重复实例日期
2. 考虑重复规则（daily, weekly, monthly 等）
3. 考虑 `repeatEndDate` 限制
4. 为每个符合条件的日期创建 completion 记录

## 安全特性

1. **幂等性**：可以多次运行，不会重复创建记录
2. **跳过已处理**：自动跳过已有 completion 记录的备忘录
3. **事务安全**：使用数据库事务确保数据一致性
4. **不删除数据**：只添加新记录，不修改或删除现有数据

## 故障排除

### 迁移服务无法连接数据库
```bash
# 检查数据库状态
docker-compose ps postgres
docker-compose logs postgres

# 确保数据库健康检查通过
docker exec chpli-postgres pg_isready -U chpli
```

### 迁移服务一直重启
迁移服务设置了 `restart: "no"`，如果失败不会自动重启。查看日志：
```bash
docker-compose logs db-migrate
```

### 需要重新运行迁移
```bash
# 删除迁移容器
docker-compose rm db-migrate

# 再次运行
docker-compose --profile migrate up db-migrate
```

## 回滚

如果需要回滚迁移（删除所有 completion 记录）：

```bash
# 进入数据库容器
docker exec -it chpli-postgres psql -U chpli -d chpli

# 执行 SQL
TRUNCATE TABLE memo_completions;

# 或者更精确地删除特定记录
DELETE FROM memo_completions WHERE createdAt > '2024-01-01';
```
