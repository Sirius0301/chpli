# 数据库修复脚本

## migrate-memo-completions.ts

为已存在的已完成备忘录生成完成记录。

### 背景

在添加 `MemoCompletion` 表之前，重复备忘录的完成状态是全局的（所有实例共享同一个状态）。
新系统允许每个重复实例有独立的完成状态。

此脚本用于迁移旧数据：
- 对于已完成的非重复备忘录：创建一个完成记录
- 对于已完成的重复备忘录：创建从开始日期到 updatedAt 之间的所有实例的完成记录

### 运行方式

```bash
# 确保数据库已连接并运行
# 在 server 目录下运行：
cd apps/calendar-memo/server

# 方式1：使用 pnpm 脚本
pnpm migrate:completions

# 方式2：直接使用 tsx
npx tsx scripts/migrate-memo-completions.ts
```

### 脚本逻辑

1. 查询所有 `completed = true` 的备忘录
2. 跳过已有 completion 记录的备忘录（避免重复创建）
3. 对于非重复备忘录 (`repeatType = 'NONE'`):
   - 创建一个 completion 记录，`instanceDate = memo.date`
4. 对于重复备忘录:
   - 计算从 `memo.date` 到 `memo.updatedAt` 之间的所有重复实例日期
   - 为每个日期创建一个 completion 记录
   - 如果设置了 `repeatEndDate`，则不超过该日期

### 注意事项

- 脚本会跳过已有 completion 记录的备忘录，可以安全地多次运行
- 对于重复备忘录，只有 `updatedAt` 日期及之前的实例会被标记为完成
- 运行前建议备份数据库
