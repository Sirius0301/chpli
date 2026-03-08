/**
 * 数据修复脚本：为已存在的已完成备忘录生成完成记录
 * 
 * 逻辑：
 * 1. 找出所有 completed = true 的备忘录
 * 2. 对于非重复备忘录：创建一个 completion 记录，instanceDate = memo.date
 * 3. 对于重复备忘录：计算从 memo.date 到 memo.updatedAt 之间的所有重复实例日期，
 *    为每个日期创建 completion 记录
 * 
 * 环境变量：
 * - DATABASE_URL: PostgreSQL 连接字符串
 */

import { PrismaClient, RepeatType } from '@prisma/client';
import { format, differenceInWeeks, differenceInMonths, eachDayOfInterval, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

/**
 * 判断日期是否匹配重复规则
 */
function isMemoMatchDate(
  startDate: Date,
  targetDate: Date,
  repeatType: RepeatType,
  repeatEndDate: string | null
): boolean {
  // 标准化为纯日期
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  // 检查是否在结束日期之后
  if (repeatEndDate) {
    const end = new Date(repeatEndDate);
    end.setHours(0, 0, 0, 0);
    if (target > end) return false;
  }

  // 检查是否在开始日期之前
  if (target < start) return false;

  // 精确匹配原始日期
  if (isSameDay(target, start)) return true;

  // 不重复
  if (repeatType === 'NONE') return false;

  switch (repeatType) {
    case 'DAILY':
      return true;

    case 'WEEKLY':
      return target.getDay() === start.getDay() && 
             differenceInWeeks(target, start) % 1 === 0;

    case 'BIWEEKLY':
      return target.getDay() === start.getDay() && 
             differenceInWeeks(target, start) % 2 === 0;

    case 'MONTHLY':
      return target.getDate() === start.getDate() &&
             differenceInMonths(target, start) % 1 === 0;

    case 'QUARTERLY':
      return target.getDate() === start.getDate() && 
             differenceInMonths(target, start) % 3 === 0;

    case 'SEMIANNUAL':
      return target.getDate() === start.getDate() && 
             differenceInMonths(target, start) % 6 === 0;

    case 'YEARLY':
      return target.getDate() === start.getDate() && 
             target.getMonth() === start.getMonth();

    default:
      return false;
  }
}

/**
 * 获取从开始日期到目标日期之间的所有重复实例日期
 */
function getRepeatInstances(
  startDateStr: string,
  targetDateStr: string,
  repeatType: RepeatType,
  repeatEndDate: string | null
): string[] {
  const startDate = new Date(startDateStr + 'T00:00:00');
  const targetDate = new Date(targetDateStr + 'T00:00:00');
  
  // 确保开始日期不晚于目标日期
  if (startDate > targetDate) {
    return [];
  }

  const instances: string[] = [];
  const days = eachDayOfInterval({ start: startDate, end: targetDate });

  for (const day of days) {
    if (isMemoMatchDate(startDate, day, repeatType, repeatEndDate)) {
      instances.push(format(day, 'yyyy-MM-dd'));
    }
  }

  return instances;
}

/**
 * 获取重复类型的中文/英文名称
 */
function getRepeatTypeName(type: RepeatType): string {
  const names: Record<RepeatType, string> = {
    'NONE': '不重复',
    'DAILY': '每天',
    'WEEKLY': '每周',
    'BIWEEKLY': '每两周',
    'MONTHLY': '每月',
    'QUARTERLY': '每季度',
    'SEMIANNUAL': '每半年',
    'YEARLY': '每年',
  };
  return names[type] || type;
}

async function migrateMemoCompletions() {
  console.log('========================================');
  console.log('数据迁移：Memo Completion 记录生成');
  console.log('========================================');
  console.log('');

  // 获取所有已完成的备忘录
  console.log('📊 查询已完成的备忘录...');
  const completedMemos = await prisma.memo.findMany({
    where: { completed: true },
    include: {
      completions: true,
    },
  });

  console.log(`✅ 找到 ${completedMemos.length} 个已完成的备忘录`);
  console.log('');

  if (completedMemos.length === 0) {
    console.log('ℹ️  没有需要迁移的数据');
    return;
  }

  // 统计分类
  const nonRepeatMemos = completedMemos.filter(m => m.repeatType === 'NONE');
  const repeatMemos = completedMemos.filter(m => m.repeatType !== 'NONE');
  
  console.log('📋 备忘录分类统计：');
  console.log(`   - 非重复备忘录: ${nonRepeatMemos.length} 个`);
  console.log(`   - 重复备忘录: ${repeatMemos.length} 个`);
  console.log('');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const memo of completedMemos) {
    try {
      // 检查是否已经有 completion 记录
      if (memo.completions.length > 0) {
        console.log(`⏭️  跳过备忘录 ${memo.id.substring(0, 8)}...: 已有 ${memo.completions.length} 个 completion 记录`);
        skippedCount++;
        continue;
      }

      // 获取备忘录的更新日期作为完成的目标日期
      const updatedAtStr = format(memo.updatedAt, 'yyyy-MM-dd');

      if (memo.repeatType === 'NONE') {
        // ==================== 非重复备忘录 ====================
        console.log(`📝 处理非重复备忘录: ${memo.id.substring(0, 8)}... | 标题: ${memo.title.substring(0, 20)}${memo.title.length > 20 ? '...' : ''} | 日期: ${memo.date}`);
        
        await prisma.memoCompletion.create({
          data: {
            memoId: memo.id,
            instanceDate: memo.date,
            completed: true,
          },
        });
        console.log(`   ✅ 创建 completion: instanceDate=${memo.date}`);
        createdCount++;
      } else {
        // ==================== 重复备忘录 ====================
        const repeatEndDate = memo.repeatEndType === 'ONDATE' ? memo.repeatEndDate : null;
        
        // 限制目标日期不超过 repeatEndDate（如果设置了）
        let targetDate = updatedAtStr;
        if (repeatEndDate && repeatEndDate < updatedAtStr) {
          targetDate = repeatEndDate;
        }

        console.log(`🔄 处理重复备忘录: ${memo.id.substring(0, 8)}... | 标题: ${memo.title.substring(0, 20)}${memo.title.length > 20 ? '...' : ''}`);
        console.log(`   重复规则: ${getRepeatTypeName(memo.repeatType)} | 开始日期: ${memo.date} | 目标日期: ${targetDate}${repeatEndDate ? ` | 结束日期: ${repeatEndDate}` : ''}`);

        const instanceDates = getRepeatInstances(
          memo.date,
          targetDate,
          memo.repeatType,
          repeatEndDate
        );

        if (instanceDates.length === 0) {
          console.log(`   ⏭️  跳过: 没有符合条件的实例日期`);
          skippedCount++;
          continue;
        }

        console.log(`   📅 将创建 ${instanceDates.length} 个 completion 记录`);

        // 为每个实例日期创建 completion 记录
        const createData = instanceDates.map(date => ({
          memoId: memo.id,
          instanceDate: date,
          completed: true,
        }));

        await prisma.memoCompletion.createMany({
          data: createData,
          skipDuplicates: true, // 跳过重复的记录
        });

        console.log(`   ✅ 成功创建 ${instanceDates.length} 个 records`);
        createdCount += instanceDates.length;
      }
    } catch (error) {
      console.error(`❌ 处理备忘录 ${memo.id} 时出错:`, error);
      errorCount++;
    }
  }

  console.log('');
  console.log('========================================');
  console.log('迁移完成！');
  console.log('========================================');
  console.log(`✅ 创建记录数: ${createdCount}`);
  console.log(`⏭️  跳过记录数: ${skippedCount}`);
  console.log(`❌ 错误数: ${errorCount}`);
  console.log('');
  
  if (errorCount > 0) {
    console.log('⚠️  警告: 有错误发生，请检查日志');
    process.exit(1);
  }
}

// 执行迁移
migrateMemoCompletions()
  .catch((e) => {
    console.error('❌ 迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
