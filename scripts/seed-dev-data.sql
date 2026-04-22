-- =============================================================================
-- Chpli Monorepo 开发环境测试数据
-- =============================================================================
-- 测试账号: test@example.com / Test123!@#
-- 用法: psql postgresql://chpli:chpli_secret@localhost:5432/chpli -f scripts/seed-dev-data.sql
-- =============================================================================

-- 测试用户 (bcrypt hash of 'Test123!@#')
INSERT INTO um_users (id, email, password, name, avatar, "isActive", "lastLoginAt", "createdAt", "updatedAt")
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test@example.com',
  '$2a$12$iOxmLLr2eVXPhTlRV5/DWOXydYKBocXOgYDM8fU6jYEcafQXLJFBO',
  '测试用户',
  NULL,
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  "isActive" = true;

-- =============================================================================
-- Calendar Memo 测试数据
-- =============================================================================

-- 标签
INSERT INTO cm_tags (id, name, color, "userId", "createdAt", "updatedAt") VALUES
  ('t0000001-0000-0000-0000-000000000001', '工作',   '#3B82F6', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('t0000001-0000-0000-0000-000000000002', '生活',   '#10B981', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('t0000001-0000-0000-0000-000000000003', '学习',   '#F59E0B', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('t0000001-0000-0000-0000-000000000004', '重要',   '#EF4444', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('t0000001-0000-0000-0000-000000000005', '周末',   '#8B5CF6', '11111111-1111-1111-1111-111111111111', NOW(), NOW())
ON CONFLICT ("userId", name) DO NOTHING;

-- 备忘录
INSERT INTO cm_memos (id, title, description, location, date, completed, "repeatType", "repeatEndType", "repeatEndDate", "customDays", priority, "imageUrl", "userId", "createdAt", "updatedAt") VALUES
  ('m0000001-0000-0000-0000-000000000001',
   '完成项目周报', '整理本周项目进度，汇总各模块完成情况', '办公室',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), false, 'NONE', 'NEVER', NULL, '{}', 'HIGH', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000002',
   '团队周会', '周五下午3点，讨论下周冲刺计划', '会议室 A',
   TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD'), false, 'WEEKLY', 'NEVER', NULL, '{}', 'MEDIUM', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000003',
   '阅读技术文档', '阅读 FastAPI 和 Prisma 官方文档', '家里',
   TO_CHAR(CURRENT_DATE - INTERVAL '2 day', 'YYYY-MM-DD'), true, 'DAILY', 'NEVER', NULL, '{}', 'LOW', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000004',
   '健身房锻炼', '有氧运动 30 分钟 + 力量训练', '健身房',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), false, 'CUSTOM', 'NEVER', NULL, '{1,3,5}', 'MEDIUM', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000005',
   '购买生活用品', '牛奶、鸡蛋、面包、水果', '超市',
   TO_CHAR(CURRENT_DATE + INTERVAL '3 day', 'YYYY-MM-DD'), false, 'NONE', 'NEVER', NULL, '{}', 'LOW', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000006',
   '学习 TypeScript 高级类型', '泛型、条件类型、映射类型实践', '书房',
   TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'), true, 'NONE', 'NEVER', NULL, '{}', 'HIGH', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000007',
   '月度复盘', '总结本月 OKR 完成情况，制定下月目标', '咖啡厅',
   TO_CHAR(CURRENT_DATE + INTERVAL '7 day', 'YYYY-MM-DD'), false, 'MONTHLY', 'NEVER', NULL, '{}', 'HIGH', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW()),

  ('m0000001-0000-0000-0000-000000000008',
   '给妈妈打电话', '每周固定问候，聊聊近况', NULL,
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), false, 'WEEKLY', 'NEVER', NULL, '{0}', 'MEDIUM', NULL,
   '11111111-1111-1111-1111-111111111111', NOW(), NOW());

-- 备忘录-标签关联
INSERT INTO "_MemoToTag" ("A", "B") VALUES
  ('m0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001'),
  ('m0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000004'),
  ('m0000001-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000001'),
  ('m0000001-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000003'),
  ('m0000001-0000-0000-0000-000000000004', 't0000001-0000-0000-0000-000000000002'),
  ('m0000001-0000-0000-0000-000000000005', 't0000001-0000-0000-0000-000000000002'),
  ('m0000001-0000-0000-0000-000000000006', 't0000001-0000-0000-0000-000000000003'),
  ('m0000001-0000-0000-0000-000000000006', 't0000001-0000-0000-0000-000000000004'),
  ('m0000001-0000-0000-0000-000000000007', 't0000001-0000-0000-0000-000000000001'),
  ('m0000001-0000-0000-0000-000000000007', 't0000001-0000-0000-0000-000000000004'),
  ('m0000001-0000-0000-0000-000000000008', 't0000001-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- 重复备忘录的完成记录（模拟一些历史完成）
INSERT INTO cm_memo_completions (id, "memoId", "instanceDate", completed, "createdAt", "updatedAt") VALUES
  ('c0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000003', TO_CHAR(CURRENT_DATE - INTERVAL '2 day', 'YYYY-MM-DD'), true, NOW(), NOW()),
  ('c0000001-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000003', TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'), true, NOW(), NOW()),
  ('c0000001-0000-0000-0000-000000000003', 'm0000001-0000-0000-0000-000000000006', TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'), true, NOW(), NOW()),
  ('c0000001-0000-0000-0000-000000000004', 'm0000001-0000-0000-0000-000000000004', TO_CHAR(CURRENT_DATE - INTERVAL '2 day', 'YYYY-MM-DD'), true, NOW(), NOW())
ON CONFLICT ("memoId", "instanceDate") DO NOTHING;

-- =============================================================================
-- Bookmark Manager 测试数据
-- =============================================================================

-- 标签
INSERT INTO bm_tags (id, user_id, name, description, created_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '开发工具', '日常开发中常用的工具网站', NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '技术博客', '优质的技术文章和博客', NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '文档参考', '官方文档和 API 参考', NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '待读', '稍后阅读的文章和资料', NOW())
ON CONFLICT DO NOTHING;

-- 书签
WITH tag_dev AS (SELECT id FROM bm_tags WHERE name = '开发工具' LIMIT 1),
     tag_blog AS (SELECT id FROM bm_tags WHERE name = '技术博客' LIMIT 1),
     tag_doc AS (SELECT id FROM bm_tags WHERE name = '文档参考' LIMIT 1),
     tag_read AS (SELECT id FROM bm_tags WHERE name = '待读' LIMIT 1)
INSERT INTO bm_bookmarks (id, user_id, url, title, description, click_count, last_clicked_at, is_required, is_deleted, deleted_at, dismissed_until, created_at, updated_at)
SELECT * FROM (VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://github.com', 'GitHub', '代码托管和协作平台', 12, NOW() - INTERVAL '1 day', true, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://stackoverflow.com', 'Stack Overflow', '开发者问答社区', 8, NOW() - INTERVAL '3 day', false, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://developer.mozilla.org', 'MDN Web Docs', 'Web 技术权威文档', 5, NULL::timestamptz, true, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://www.prisma.io/docs', 'Prisma Documentation', 'Prisma ORM 官方文档', 3, NULL::timestamptz, false, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://fastapi.tiangolo.com', 'FastAPI Docs', 'FastAPI 框架官方文档', 2, NULL::timestamptz, false, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://react.dev', 'React 官方文档', 'React 最新版文档和教程', 4, NOW() - INTERVAL '5 day', false, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://tailwindcss.com', 'Tailwind CSS', '实用优先的 CSS 框架', 1, NULL::timestamptz, false, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'https://news.ycombinator.com', 'Hacker News', '科技新闻和讨论社区', 6, NOW() - INTERVAL '2 day', false, false, NULL::timestamptz, NULL::timestamptz, NOW(), NOW())
) AS v(id, user_id, url, title, description, click_count, last_clicked_at, is_required, is_deleted, deleted_at, dismissed_until, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM bm_bookmarks WHERE url = v.url);

-- 书签-标签关联
INSERT INTO bm_bookmark_tags (bookmark_id, tag_id)
SELECT b.id, t.id
FROM bm_bookmarks b
CROSS JOIN bm_tags t
WHERE b.url = 'https://github.com' AND t.name = '开发工具'
   OR b.url = 'https://stackoverflow.com' AND t.name IN ('开发工具', '技术博客')
   OR b.url = 'https://developer.mozilla.org' AND t.name IN ('文档参考', '开发工具')
   OR b.url = 'https://www.prisma.io/docs' AND t.name IN ('文档参考', '待读')
   OR b.url = 'https://fastapi.tiangolo.com' AND t.name IN ('文档参考', '开发工具')
   OR b.url = 'https://react.dev' AND t.name IN ('文档参考', '开发工具')
   OR b.url = 'https://tailwindcss.com' AND t.name = '开发工具'
   OR b.url = 'https://news.ycombinator.com' AND t.name = '技术博客'
ON CONFLICT DO NOTHING;

-- 点击记录
INSERT INTO bm_click_logs (id, bookmark_id, user_id, clicked_at)
SELECT gen_random_uuid(), b.id, '11111111-1111-1111-1111-111111111111'::uuid, NOW() - (RANDOM() * INTERVAL '10 days')
FROM bm_bookmarks b
WHERE b.click_count > 0
  AND NOT EXISTS (SELECT 1 FROM bm_click_logs cl WHERE cl.bookmark_id = b.id);

-- 填充 click_count 对应的点击记录（为每个有 click_count 的书签生成相应数量的点击记录）
INSERT INTO bm_click_logs (id, bookmark_id, user_id, clicked_at)
SELECT gen_random_uuid(), b.id, '11111111-1111-1111-1111-111111111111'::uuid, NOW() - (gs.n * INTERVAL '1 day' * (0.5 + RANDOM()))
FROM bm_bookmarks b
CROSS JOIN generate_series(1, b.click_count) AS gs(n)
WHERE b.click_count > 0
  AND NOT EXISTS (
    SELECT 1 FROM bm_click_logs cl
    WHERE cl.bookmark_id = b.id
    HAVING COUNT(*) >= b.click_count
  );
