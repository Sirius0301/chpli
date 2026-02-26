/**
 * 标签用户私有化数据迁移脚本
 * 
 * 功能：
 * 1. 为没有 userId 的标签根据关联的 Memo 推断归属
 * 2. 无法推断的标签（无关联备忘录）将被删除
 * 3. 同名标签合并
 * 
 * 使用方法：
 * npx tsx scripts/migrate-tags.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTags() {
  console.log('🚀 开始标签私有化迁移...\n');

  try {
    // 1. 检查是否需要迁移
    const allTags = await prisma.tag.findMany({
      include: {
        memos: {
          select: { userId: true },
        },
      },
    });

    console.log(`📊 共找到 ${allTags.length} 个标签`);

    let migrated = 0;
    let deleted = 0;
    let skipped = 0;

    for (const tag of allTags) {
      // 如果已经有 userId，跳过
      if (tag.userId) {
        skipped++;
        continue;
      }

      console.log(`\n🏷️ 处理标签: ${tag.name} (${tag.id})`);

      // 收集关联的用户
      const userCount = new Map<string, number>();
      for (const memo of tag.memos) {
        if (memo.userId) {
          userCount.set(memo.userId, (userCount.get(memo.userId) || 0) + 1);
        }
      }

      // 确定主要归属用户
      let mainUserId: string | null = null;
      let maxCount = 0;

      for (const [userId, count] of userCount) {
        if (count > maxCount) {
          maxCount = count;
          mainUserId = userId;
        }
      }

      if (!mainUserId) {
        // 无关联备忘录，删除标签
        console.log(`  ⚠️ 无关联备忘录，删除标签`);
        await prisma.tag.delete({ where: { id: tag.id } });
        deleted++;
        continue;
      }

      console.log(`  👤 归属用户: ${mainUserId} (${maxCount} 个备忘录)`);

      // 检查该用户是否已有同名标签
      const existingTag = await prisma.tag.findFirst({
        where: {
          userId: mainUserId,
          name: tag.name,
          id: { not: tag.id },
        },
      });

      if (existingTag) {
        // 合并标签：将当前标签的备忘录关联到已有标签
        console.log(`  🔄 发现同名标签 ${existingTag.id}，合并中...`);
        
        // 获取当前标签关联的备忘录
        const memoIds = tag.memos.map(m => m.id);
        
        // 解除当前标签关联
        await prisma.tag.update({
          where: { id: tag.id },
          data: {
            memos: {
              disconnect: memoIds.map(id => ({ id })),
            },
          },
        });

        // 关联到目标标签（跳过已存在的）
        for (const memoId of memoIds) {
          try {
            await prisma.tag.update({
              where: { id: existingTag.id },
              data: {
                memos: {
                  connect: { id: memoId },
                },
              },
            });
          } catch (e: any) {
            // 可能已存在关联，忽略错误
            if (e.code !== 'P2022') {
              console.log(`    跳过已关联的备忘录: ${memoId}`);
            }
          }
        }

        // 删除旧标签
        await prisma.tag.delete({ where: { id: tag.id } });
        console.log(`  ✅ 已合并到 ${existingTag.id} 并删除原标签`);
      } else {
        // 直接设置 userId
        await prisma.tag.update({
          where: { id: tag.id },
          data: { userId: mainUserId },
        });
        console.log(`  ✅ 已设置归属用户`);
      }

      migrated++;
    }

    console.log('\n📈 迁移统计：');
    console.log(`   ✅ 成功迁移: ${migrated} 个标签`);
    console.log(`   🗑️  删除空标签: ${deleted} 个`);
    console.log(`   ⏭️  已存在userId: ${skipped} 个`);
    console.log('\n🎉 迁移完成！');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行迁移
migrateTags();
