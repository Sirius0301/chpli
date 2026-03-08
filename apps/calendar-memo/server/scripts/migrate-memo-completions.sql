-- 数据修复脚本：为已存在的已完成备忘录生成完成记录（SQL 版本）
-- 适用于无法运行 TypeScript 脚本的环境

-- 注意：此脚本仅处理非重复备忘录
-- 对于重复备忘录，由于其复杂性（需要按重复规则计算日期），建议使用 TypeScript 脚本

-- 开始事务
BEGIN;

-- 1. 为非重复且已完成的备忘录创建 completion 记录
INSERT INTO memo_completions (id, "memoId", "instanceDate", completed, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    m.id,
    m.date,
    true,
    NOW(),
    NOW()
FROM memos m
WHERE m.completed = true
  AND m."repeatType" = 'NONE'
  AND NOT EXISTS (
      SELECT 1 FROM memo_completions mc 
      WHERE mc."memoId" = m.id
  );

-- 查看插入结果
-- SELECT '非重复备忘录 completion 记录创建完成' AS message;

-- 提交事务
COMMIT;

-- 说明：
-- 1. 此脚本只处理非重复备忘录（repeatType = 'NONE'）
-- 2. 重复备忘录需要按重复规则计算实例日期，过于复杂，建议使用 TypeScript 脚本
-- 3. 脚本会跳过已有 completion 记录的备忘录
-- 4. 如果需要处理重复备忘录，请运行: pnpm migrate:completions
