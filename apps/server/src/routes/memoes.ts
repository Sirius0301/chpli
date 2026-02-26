import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { db, statements, rowToMemo } from '../db';
import type { CreateMemoDTO, UpdateMemoDTO } from '@calendar-memo/types';

const router = Router();

// 验证 Schema
const createMemoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  completed: z.boolean().optional().default(false),
  repeatType: z.enum(['none', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'yearly']).optional().default('none'),
  repeatEndType: z.enum(['never', 'onDate']).optional().default('never'),
  repeatEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

// GET /api/memos
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, tags, priorities } = req.query;

    let rows;
    if (startDate && endDate) {
      rows = statements.getMemosByDateRange.all({ 
        start: startDate as string, 
        end: endDate as string 
      });
    } else {
      rows = statements.getAllMemos.all();
    }

    let memos = rows.map(rowToMemo);

    // 标签筛选 (OR 逻辑)
    if (tags && typeof tags === 'string' && tags.length > 0) {
      const tagIds = tags.split(',');
      memos = memos.filter(memo => 
        memo.tags.some(tag => tagIds.includes(tag.id))
      );
    }

    // 优先级筛选
    if (priorities && typeof priorities === 'string') {
      const priorityList = priorities.split(',') as ('high' | 'medium' | 'low')[];
      memos = memos.filter(memo => memo.priority && priorityList.includes(memo.priority));
    }

    res.json({ success: true, data: memos });
  } catch (error) {
    console.error('[GET /memos]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: '获取备忘录失败' });
  }
});

// GET /api/memos/:id
router.get('/:id', (req, res) => {
  try {
    const row = statements.getMemoById.get({ id: req.params.id });
    if (!row) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND', message: '备忘录不存在' });
    }
    res.json({ success: true, data: rowToMemo(row) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// POST /api/memos
router.post('/', (req, res) => {
  try {
    const parsed = createMemoSchema.parse(req.body);
    const id = uuidv4();

    const insert = db.transaction(() => {
      statements.createMemo.run({
        id,
        title: parsed.title,
        description: parsed.description || null,
        location: parsed.location || null,
        date: parsed.date,
        completed: parsed.completed ? 1 : 0,
        repeatType: parsed.repeatType,
        repeatEndType: parsed.repeatEndType,
        repeatEndDate: parsed.repeatEndDate || null,
        priority: parsed.priority || null,
        imageUrl: parsed.imageUrl || null,
      });

      // 关联标签
      if (parsed.tagIds && parsed.tagIds.length > 0) {
        for (const tagId of parsed.tagIds) {
          statements.addMemoTag.run({ memoId: id, tagId });
        }
      }
    });

    insert();

    const newMemo = rowToMemo(statements.getMemoById.get({ id }));
    res.status(201).json({ success: true, data: newMemo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: error.errors });
    }
    console.error('[POST /memos]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/memos/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = statements.getMemoById.get({ id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND' });
    }

    const parsed = createMemoSchema.partial().parse(req.body);

    const update = db.transaction(() => {
      statements.updateMemo.run({
        id,
        title: parsed.title ?? existing.title,
        description: parsed.description !== undefined ? parsed.description : existing.description,
        location: parsed.location !== undefined ? parsed.location : existing.location,
        date: parsed.date ?? existing.date,
        completed: parsed.completed !== undefined ? (parsed.completed ? 1 : 0) : existing.completed,
        repeatType: parsed.repeatType ?? existing.repeat_type,
        repeatEndType: parsed.repeatEndType ?? existing.repeat_end_type,
        repeatEndDate: parsed.repeatEndDate !== undefined ? parsed.repeatEndDate : existing.repeat_end_date,
        priority: parsed.priority !== undefined ? parsed.priority : existing.priority,
        imageUrl: parsed.imageUrl !== undefined ? parsed.imageUrl : existing.image_url,
      });

      // 更新标签关联（先删后加）
      if (parsed.tagIds) {
        statements.removeMemoTags.run({ memoId: id });
        for (const tagId of parsed.tagIds) {
          statements.addMemoTag.run({ memoId: id, tagId });
        }
      }
    });

    update();

    const updated = rowToMemo(statements.getMemoById.get({ id }));
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: error.errors });
    }
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/memos/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = statements.getMemoById.get({ id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND' });
    }

    // 删除关联的图片文件（如果存在）
    const memo = rowToMemo(existing);
    if (memo.imageUrl) {
      const filename = memo.imageUrl.replace('/uploads/', '');
      const imagePath = join(process.cwd(), 'uploads', filename);
      if (existsSync(imagePath)) {
        try {
          unlinkSync(imagePath);
        } catch (err) {
          console.error('[Delete Memo] Failed to delete image:', err);
          // 图片删除失败不影响备忘录删除
        }
      }
    }

    statements.deleteMemo.run({ id });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[DELETE /memos/:id]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/memos/:id/toggle
router.patch('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    statements.toggleComplete.run({ id });
    const updated = rowToMemo(statements.getMemoById.get({ id }));
    res.json({ success: true, data: { completed: updated.completed } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export default router;
