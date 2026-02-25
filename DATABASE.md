# 数据库设计文档

数据库: SQLite 3 (通过 better-sqlite3 访问)
文件位置: `apps/server/database.sqlite`

## 1. 实体关系图 (ER Diagram)

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   memos     │       │   memo_tags     │       │    tags     │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ PK id       │───────│ FK memo_id      │       │ PK id       │
│    title    │       │ FK tag_id       │───────│    name     │
│    date     │       └─────────────────┘       │    color    │
│    repeat_  │                                 └─────────────┘
│    type     │
│    priority │
└─────────────┘
```

关系: memos (1) --- (N) memo_tags (N) --- (1) tags (多对多)

## 2. 表结构定义

### 2.1 memos (备忘录主表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| title | TEXT | NOT NULL | 标题 |
| description | TEXT | NULL | 备注/描述 |
| location | TEXT | NULL | 地点 |
| date | DATE | NOT NULL | 开始日期 (YYYY-MM-DD) |
| completed | BOOLEAN | DEFAULT 0 | 是否完成 |
| repeat_type | TEXT | DEFAULT 'none' | 重复类型: none/weekly/biweekly/monthly/quarterly/semiannual/yearly |
| repeat_end_type | TEXT | DEFAULT 'never' | 结束类型: never/onDate |
| repeat_end_date | DATE | NULL | 结束日期（当 end_type='onDate'）|
| priority | TEXT | NULL | 优先级: high/medium/low |
| image_url | TEXT | NULL | 图片相对路径，如 /uploads/xxx.jpg |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
```sql
CREATE INDEX idx_memos_date ON memos(date);
CREATE INDEX idx_memos_repeat_type ON memos(repeat_type);
CREATE INDEX idx_memos_priority ON memos(priority);
```

### 2.2 tags (标签表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | UNIQUE NOT NULL | 标签名 |
| color | TEXT | NULL | 颜色代码，如 #FF6B6B |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.3 memo_tags (关联表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| memo_id | TEXT | NOT NULL FK | 备忘录ID |
| tag_id | TEXT | NOT NULL FK | 标签ID |
| PRIMARY KEY | (memo_id, tag_id) | 复合主键 | 防止重复关联 |

**外键约束**:
- memo_id → memos(id) ON DELETE CASCADE
- tag_id → tags(id) ON DELETE CASCADE

**索引**:
```sql
CREATE INDEX idx_memo_tags_memo ON memo_tags(memo_id);
CREATE INDEX idx_memo_tags_tag ON memo_tags(tag_id);
```

## 3. 初始化 SQL (schema.sql)

```sql
-- 启用外键支持
PRAGMA foreign_keys = ON;

-- 备忘录表
CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT 0,
    repeat_type TEXT DEFAULT 'none' CHECK (repeat_type IN ('none', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'yearly')),
    repeat_end_type TEXT DEFAULT 'never' CHECK (repeat_end_type IN ('never', 'onDate')),
    repeat_end_date DATE,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 关联表
CREATE TABLE IF NOT EXISTS memo_tags (
    memo_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (memo_id, tag_id),
    FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_memos_date ON memos(date);
CREATE INDEX IF NOT EXISTS idx_memos_repeat ON memos(repeat_type);
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo ON memo_tags(memo_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_memos_timestamp 
AFTER UPDATE ON memos
BEGIN
    UPDATE memos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

## 4. 数据访问模式

### 4.1 查询某日期范围内的备忘录（含标签）
```sql
SELECT 
    m.*,
    GROUP_CONCAT(t.id, '|') as tag_ids,
    GROUP_CONCAT(t.name, '|') as tag_names,
    GROUP_CONCAT(t.color, '|') as tag_colors
FROM memos m
LEFT JOIN memo_tags mt ON m.id = mt.memo_id
LEFT JOIN tags t ON mt.tag_id = t.id
WHERE m.date BETWEEN ? AND ?
GROUP BY m.id
ORDER BY m.date DESC;
```

### 4.2 根据标签筛选（OR 逻辑）
```sql
SELECT DISTINCT m.* 
FROM memos m
JOIN memo_tags mt ON m.id = mt.memo_id
WHERE mt.tag_id IN (?, ?)  -- 参数为选中的标签IDs
AND m.date BETWEEN ? AND ?;
```

### 4.3 插入备忘录并关联标签（事务）
```sql
BEGIN TRANSACTION;

INSERT INTO memos (id, title, ..., repeat_type) 
VALUES (@id, @title, ..., @repeatType);

INSERT INTO memo_tags (memo_id, tag_id) 
VALUES (@id, @tagId1), (@id, @tagId2);

COMMIT;
```

## 5. 备份与迁移策略

- **备份**: 直接复制 `database.sqlite` 文件（SQLite 是单文件数据库）
- **版本控制**: 将 schema.sql 纳入 git，数据库文件加入 .gitignore
- **迁移**: 简单项目采用递增式 SQL 文件命名 `migrations/001_init.sql`, `migrations/002_add_index.sql`
- **导出导入**: Phase 2 支持 JSON/CSV 导出时，编写转换脚本

## 6. 容量规划

- 单表性能: SQLite 轻松支持 100万+ 条记录
- 预估使用: 个人用户 10 年使用，每日 10 条备忘录 = 36,500 条，远未达瓶颈
- 图片存储: 本地文件系统，建议定期清理未引用的孤儿文件
