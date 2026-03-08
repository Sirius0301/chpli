/**
 * 数据修复脚本：为已存在的已完成备忘录生成完成记录
 * 
 * 逻辑：
 * 1. 找出所有 completed = true 的备忘录
 * 2. 对于非重复备忘录：创建一个 completion 记录，instanceDate = memo.date
 * 3. 对于重复备忘录：计算从 memo.date 到 memo.updatedAt 之间的所有重复实例日期，
 *    为每个日期创建 completion 记录
 */

import { PrismaClient, RepeatType } from '@prisma/client';
import { format, addDays, addWeeks, addMonths, differenceInWeeks, differenceInMonths, eachDayOfInterval, isSameDay } from 'date-fns';

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

async function migrateMemoCompletions() {
  console.log('开始数据迁移...');

  // 获取所有已完成的备忘录
  const completedMemos = await prisma.memo.findMany({
    where: { completed: true },
    include: {
      completions: true,
    },
  });

  console.log(`找到 ${completedMemos.length} 个已完成的备忘录`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const memo of completedMemos) {
    try {
      // 检查是否已经有 completion 记录
      if (memo.completions.length > 0) {
        console.log(`跳过备忘录 ${memo.id}: 已有 ${memo.completions.length} 个 completion 记录`);
        skippedCount++;
        continue;
      }

      // 获取备忘录的更新日期作为完成的目标日期
      const updatedAtStr = format(memo.updatedAt, 'yyyy-MM-dd');

      if (memo.repeatType === 'NONE') {
        // 非重复备忘录：创建一个 completion 记录
        await prisma.memoCompletion.create({
          data: {
            memoId: memo.id,
            instanceDate: memo.date,
            completed: true,
          },
        });
        console.log(`创建非重复备忘录 completion: ${memo.id}, date: ${memo.date}`);
        createdCount++;
      } else {
        // 重复备忘录：计算从开始日期到 updatedAt 之间的所有实例日期
        const repeatEndDate = memo.repeatEndType === 'ONDATE' ? memo.repeatEndDate : null;
        
        // 限制目标日期不超过 repeatEndDate（如果设置了）
        let targetDate = updatedAtStr;
        if (repeatEndDate && repeatEndDate < updatedAtStr) {
          targetDate = repeatEndDate;
        }

        const instanceDates = getRepeatInstances(
          memo.date,
          targetDate,
          memo.repeatType,
          repeatEndDate
        );

        if (instanceDates.length === 0) {
          console.log(`跳过备忘录 ${memo.id}: 没有符合条件的实例日期`);
          skippedCount++;
          continue;
        }

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

        console.log(`创建重复备忘录 completions: ${memo.id}, 实例数: ${instanceDates.length}, 日期范围: ${memo.date} 到 ${targetDate}`);
        createdCount += instanceDates.length;
      }
    } catch (error) {
      console.error(`处理备忘录 ${memo.id} 时出错:`, error);
      errorCount++;
    }
  }

  console.log('\n迁移完成！');
  console.log(`创建记录数: ${createdCount}`);
  console.log(`跳过记录数: ${skippedCount}`);
  console.log(`错误数: ${errorCount}`);
}

// 执行迁移
migrateMemoCompletions()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
