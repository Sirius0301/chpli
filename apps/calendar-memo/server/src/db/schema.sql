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

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_memos_date ON memos(date);
CREATE INDEX IF NOT EXISTS idx_memos_repeat ON memos(repeat_type);
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo ON memo_tags(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_tag ON memo_tags(tag_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_memos_timestamp 
AFTER UPDATE ON memos
BEGIN
    UPDATE memos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
