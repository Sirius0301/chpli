import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Memo, Tag } from '@calendar-memo/types';

// 数据库文件路径
const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'database.sqlite');

// 创建连接
const db = new Database(DB_PATH);

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化 Schema
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

console.log('[Database] Connected to', DB_PATH);

// 预处理语句（性能优化）
export const statements = {
  // Memos
  getAllMemos: db.prepare(`
    SELECT m.*, 
      GROUP_CONCAT(t.id, '|') as tag_ids,
      GROUP_CONCAT(t.name, '|') as tag_names,
      GROUP_CONCAT(t.color, '|') as tag_colors
    FROM memos m
    LEFT JOIN memo_tags mt ON m.id = mt.memo_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    GROUP BY m.id
    ORDER BY m.date DESC, m.created_at DESC
  `),

  getMemosByDateRange: db.prepare(`
    SELECT m.*,
      GROUP_CONCAT(t.id, '|') as tag_ids,
      GROUP_CONCAT(t.name, '|') as tag_names,
      GROUP_CONCAT(t.color, '|') as tag_colors
    FROM memos m
    LEFT JOIN memo_tags mt ON m.id = mt.memo_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE m.date BETWEEN @start AND @end
    GROUP BY m.id
    ORDER BY m.date ASC
  `),

  getMemoById: db.prepare(`
    SELECT m.*,
      GROUP_CONCAT(t.id, '|') as tag_ids,
      GROUP_CONCAT(t.name, '|') as tag_names,
      GROUP_CONCAT(t.color, '|') as tag_colors
    FROM memos m
    LEFT JOIN memo_tags mt ON m.id = mt.memo_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE m.id = @id
    GROUP BY m.id
  `),

  createMemo: db.prepare(`
    INSERT INTO memos (id, title, description, location, date, completed, repeat_type, repeat_end_type, repeat_end_date, priority, image_url)
    VALUES (@id, @title, @description, @location, @date, @completed, @repeatType, @repeatEndType, @repeatEndDate, @priority, @imageUrl)
  `),

  updateMemo: db.prepare(`
    UPDATE memos SET
      title = @title,
      description = @description,
      location = @location,
      date = @date,
      completed = @completed,
      repeat_type = @repeatType,
      repeat_end_type = @repeatEndType,
      repeat_end_date = @repeatEndDate,
      priority = @priority,
      image_url = @imageUrl
    WHERE id = @id
  `),

  deleteMemo: db.prepare('DELETE FROM memos WHERE id = @id'),

  toggleComplete: db.prepare(`
    UPDATE memos SET completed = NOT completed WHERE id = @id
  `),

  // Tags
  getAllTags: db.prepare(`
    SELECT t.*, COUNT(mt.memo_id) as count 
    FROM tags t
    LEFT JOIN memo_tags mt ON t.id = mt.tag_id
    GROUP BY t.id
    ORDER BY count DESC
  `),

  createTag: db.prepare('INSERT INTO tags (id, name, color) VALUES (@id, @name, @color)'),

  updateTag: db.prepare('UPDATE tags SET name = @name, color = @color WHERE id = @id'),

  deleteTag: db.prepare('DELETE FROM tags WHERE id = @id'),

  // Relations
  addMemoTag: db.prepare('INSERT INTO memo_tags (memo_id, tag_id) VALUES (@memoId, @tagId)'),

  removeMemoTags: db.prepare('DELETE FROM memo_tags WHERE memo_id = @memoId'),

  getMemoTags: db.prepare('SELECT tag_id FROM memo_tags WHERE memo_id = @memoId'),
};

// 辅助函数：将原始行转换为 Memo 对象（解析 tag 字符串）
export function rowToMemo(row: any): Memo {
  const tags: Tag[] = [];
  if (row.tag_ids) {
    const ids = row.tag_ids.split('|');
    const names = row.tag_names.split('|');
    const colors = row.tag_colors ? row.tag_colors.split('|') : [];

    for (let i = 0; i < ids.length; i++) {
      if (ids[i]) {
        tags.push({
          id: ids[i],
          name: names[i] || '',
          color: colors[i],
        });
      }
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    date: row.date,
    completed: Boolean(row.completed),
    repeatType: row.repeat_type,
    repeatEndType: row.repeat_end_type,
    repeatEndDate: row.repeat_end_date,
    priority: row.priority,
    imageUrl: row.image_url,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export { db };
