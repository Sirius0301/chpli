import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, statements } from '../db';

const router = Router();

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// GET /api/tags
router.get('/', (req, res) => {
  try {
    const rows = statements.getAllTags.all();
    const tags = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      count: row.count,
    }));
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('[GET /tags]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// POST /api/tags
router.post('/', (req, res) => {
  try {
    const parsed = createTagSchema.parse(req.body);
    const id = uuidv4();

    // 随机颜色（如果未提供）
    const color = parsed.color || generateRandomColor();

    try {
      statements.createTag.run({ id, name: parsed.name, color });
    } catch (err: any) {
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ success: false, error: 'DUPLICATE_TAG', message: '标签名已存在' });
      }
      throw err;
    }

    const row = statements.getAllTags.all().find((r: any) => r.id === id);
    res.status(201).json({ success: true, data: { id, name: parsed.name, color, count: 0 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: error.errors });
    }
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/tags/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const parsed = createTagSchema.partial().parse(req.body);

    const updateData: any = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.color !== undefined) updateData.color = parsed.color;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: '无更新内容' });
    }

    // 检查是否存在
    const existing = statements.getAllTags.all().find((r: any) => r.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'TAG_NOT_FOUND' });
    }

    statements.updateTag.run({ 
      id, 
      name: updateData.name || existing.name, 
      color: updateData.color || existing.color 
    });

    res.json({ success: true, data: { id, name: updateData.name || existing.name, color: updateData.color || existing.color } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/tags/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否存在
    const existing = statements.getAllTags.all().find((r: any) => r.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'TAG_NOT_FOUND' });
    }

    statements.deleteTag.run({ id });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

function generateRandomColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default router;
