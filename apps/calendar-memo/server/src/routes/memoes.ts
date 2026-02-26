import { Router } from 'express';
import { z } from 'zod';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { prisma } from '../db/prisma';
import { authMiddleware } from './auth';

const router = Router();

// 所有备忘录路由需要认证
router.use(authMiddleware);

// 验证 Schema
const createMemoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean().optional().default(false),
  repeatType: z.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'yearly']).optional().default('none'),
  repeatEndType: z.enum(['never', 'onDate']).optional().default('never'),
  repeatEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

/**
 * 验证标签归属
 */
async function validateTagIds(tagIds: string[] | undefined, userId: string): Promise<{ valid: boolean; message?: string }> {
  if (!tagIds || tagIds.length === 0) {
    return { valid: true };
  }

  const tags = await prisma.tag.findMany({
    where: {
      id: { in: tagIds },
      userId,
    },
  });

  if (tags.length !== tagIds.length) {
    return { valid: false, message: '存在无效的标签或无权限使用' };
  }

  return { valid: true };
}

/**
 * GET /api/memos
 * 获取当前用户的备忘录
 */
router.get('/', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, tags, priorities } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate as string,
        lte: endDate as string,
      };
    }

    let memos = await prisma.memo.findMany({
      where,
      include: {
        tags: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // 标签筛选 (AND 逻辑)
    if (tags && typeof tags === 'string' && tags.length > 0) {
      const tagIds = tags.split(',');
      memos = memos.filter(memo =>
        tagIds.every(tagId => memo.tags.some(tag => tag.id === tagId))
      );
    }

    // 优先级筛选
    if (priorities && typeof priorities === 'string') {
      const priorityList = priorities.split(',') as ('high' | 'medium' | 'low')[];
      memos = memos.filter(memo => memo.priority && priorityList.includes(memo.priority.toLowerCase() as any));
    }

    res.json({ success: true, data: memos });
  } catch (error) {
    console.error('[GET /memos]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: '获取备忘录失败' });
  }
});

/**
 * GET /api/memos/:id
 * 获取单个备忘录
 */
router.get('/:id', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const memo = await prisma.memo.findFirst({
      where: { id, userId },
      include: {
        tags: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!memo) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND', message: '备忘录不存在' });
    }

    res.json({ success: true, data: memo });
  } catch (error) {
    console.error('[GET /memos/:id]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/memos
 * 创建备忘录
 */
router.post('/', async (req: any, res) => {
  try {
    const userId = req.userId;
    const parsed = createMemoSchema.parse(req.body);

    // 验证标签权限
    if (parsed.tagIds && parsed.tagIds.length > 0) {
      const tagValidation = await validateTagIds(parsed.tagIds, userId);
      if (!tagValidation.valid) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: tagValidation.message,
        });
      }
    }

    const memo = await prisma.memo.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        date: parsed.date,
        completed: parsed.completed,
        repeatType: parsed.repeatType.toUpperCase() as any,
        repeatEndType: parsed.repeatEndType.toUpperCase() as any,
        repeatEndDate: parsed.repeatEndDate,
        priority: parsed.priority?.toUpperCase() as any,
        imageUrl: parsed.imageUrl,
        userId,
        tags: parsed.tagIds ? {
          connect: parsed.tagIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        tags: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    res.status(201).json({ success: true, data: memo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: error.errors });
    }
    console.error('[POST /memos]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * PUT /api/memos/:id
 * 更新备忘录
 */
router.put('/:id', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = await prisma.memo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND', message: '备忘录不存在' });
    }

    const parsed = createMemoSchema.partial().parse(req.body);

    // 验证标签权限
    if (parsed.tagIds) {
      const tagValidation = await validateTagIds(parsed.tagIds, userId);
      if (!tagValidation.valid) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: tagValidation.message,
        });
      }
    }

    const updateData: any = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.location !== undefined) updateData.location = parsed.location;
    if (parsed.date !== undefined) updateData.date = parsed.date;
    if (parsed.completed !== undefined) updateData.completed = parsed.completed;
    if (parsed.repeatType !== undefined) updateData.repeatType = parsed.repeatType.toUpperCase();
    if (parsed.repeatEndType !== undefined) updateData.repeatEndType = parsed.repeatEndType.toUpperCase();
    if (parsed.repeatEndDate !== undefined) updateData.repeatEndDate = parsed.repeatEndDate;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority?.toUpperCase();
    if (parsed.imageUrl !== undefined) updateData.imageUrl = parsed.imageUrl;

    // 处理标签关联
    if (parsed.tagIds) {
      updateData.tags = {
        set: parsed.tagIds.map(id => ({ id })),
      };
    }

    const updated = await prisma.memo.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: error.errors });
    }
    console.error('[PUT /memos/:id]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/memos/:id
 * 删除备忘录
 */
router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = await prisma.memo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND', message: '备忘录不存在' });
    }

    // 删除关联的图片文件
    if (existing.imageUrl) {
      const filename = existing.imageUrl.replace('/uploads/', '');
      const imagePath = join(process.cwd(), 'uploads', filename);
      if (existsSync(imagePath)) {
        try {
          unlinkSync(imagePath);
        } catch (err) {
          console.error('[Delete Memo] Failed to delete image:', err);
        }
      }
    }

    await prisma.memo.delete({
      where: { id },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[DELETE /memos/:id]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * PATCH /api/memos/:id/toggle
 * 切换完成状态
 */
router.patch('/:id/toggle', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = await prisma.memo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'MEMO_NOT_FOUND', message: '备忘录不存在' });
    }

    const updated = await prisma.memo.update({
      where: { id },
      data: { completed: !existing.completed },
      select: { completed: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATCH /memos/:id/toggle]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export default router;
