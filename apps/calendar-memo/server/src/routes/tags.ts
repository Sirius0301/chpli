import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from './auth';

const router = Router();

// 所有标签路由需要认证
router.use(authMiddleware);

// 验证 Schema
const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * GET /api/tags
 * 获取当前用户的所有标签
 */
router.get('/', async (req: any, res) => {
  try {
    const userId = req.userId;

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { memos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 格式化响应
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: tag._count.memos,
    }));

    res.json({ success: true, data: formattedTags });
  } catch (error) {
    console.error('[GET /tags]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: '获取标签失败' });
  }
});

/**
 * POST /api/tags
 * 创建标签（自动关联当前用户）
 */
router.post('/', async (req: any, res) => {
  try {
    const parsed = createTagSchema.parse(req.body);
    const userId = req.userId;

    // 随机颜色（如果未提供）
    const color = parsed.color || generateRandomColor();

    try {
      const tag = await prisma.tag.create({
        data: {
          name: parsed.name,
          color,
          userId,
        },
        include: {
          _count: {
            select: { memos: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          count: 0,
        },
      });
    } catch (err: any) {
      // 处理唯一性冲突
      if (err.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_TAG',
          message: '标签名已存在',
        });
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.errors,
      });
    }
    console.error('[POST /tags]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * PUT /api/tags/:id
 * 更新标签（仅允许更新自己的标签）
 */
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const parsed = createTagSchema.partial().parse(req.body);

    // 检查标签是否存在且属于当前用户
    const existing = await prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: '标签不存在或无权限',
      });
    }

    // 构建更新数据
    const updateData: any = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.color !== undefined) updateData.color = parsed.color;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '无更新内容',
      });
    }

    try {
      const updated = await prisma.tag.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { memos: true },
          },
        },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          color: updated.color,
          count: updated._count.memos,
        },
      });
    } catch (err: any) {
      // 处理唯一性冲突
      if (err.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_TAG',
          message: '标签名已存在',
        });
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    }
    console.error('[PUT /tags/:id]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/tags/:id
 * 删除标签（仅允许删除自己的标签）
 * 删除标签会解除与备忘录的关联，但不删除备忘录
 */
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 检查标签是否存在且属于当前用户
    const existing = await prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: '标签不存在或无权限',
      });
    }

    // 删除标签（Prisma 会自动解除与 Memo 的多对多关联）
    await prisma.tag.delete({
      where: { id },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[DELETE /tags/:id]', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

function generateRandomColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default router;
