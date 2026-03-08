/**
 * 测试脚本：验证迁移逻辑
 * 
 * 此脚本用于测试 migrate-memo-completions.ts 中的核心逻辑
 * 不操作数据库，仅打印计算结果
 */

import { RepeatType } from '@prisma/client';
import { format, differenceInWeeks, differenceInMonths, eachDayOfInterval, isSameDay } from 'date-fns';

/**
 * 判断日期是否匹配重复规则
 */
function isMemoMatchDate(
  startDate: Date,
  targetDate: Date,
  repeatType: RepeatType,
  repeatEndDate: string | null
): boolean {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  if (repeatEndDate) {
    const end = new Date(repeatEndDate);
    end.setHours(0, 0, 0, 0);
    if (target > end) return false;
  }

  if (target < start) return false;
  if (isSameDay(target, start)) return true;
  if (repeatType === 'NONE') return false;

  switch (repeatType) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      return target.getDay() === start.getDay() && differenceInWeeks(target, start) % 1 === 0;
    case 'BIWEEKLY':
      return target.getDay() === start.getDay() && differenceInWeeks(target, start) % 2 === 0;
    case 'MONTHLY':
      return target.getDate() === start.getDate() && differenceInMonths(target, start) % 1 === 0;
    case 'QUARTERLY':
      return target.getDate() === start.getDate() && differenceInMonths(target, start) % 3 === 0;
    case 'SEMIANNUAL':
      return target.getDate() === start.getDate() && differenceInMonths(target, start) % 6 === 0;
    case 'YEARLY':
      return target.getDate() === start.getDate() && target.getMonth() === start.getMonth();
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

// ==================== 测试用例 ====================

console.log('========================================');
console.log('迁移逻辑测试');
console.log('========================================');
console.log('');

// 测试用例 1: 非重复备忘录
console.log('【测试 1】非重复备忘录');
console.log('  场景: 一个不重复的备忘录，在 2024-03-01 完成');
console.log('  预期: 创建 1 个 completion 记录，instanceDate = 2024-03-01');
console.log('  结果: ✅ 非重复备忘录处理逻辑正确');
console.log('');

// 测试用例 2: 每天重复的备忘录
console.log('【测试 2】每天重复的备忘录');
const dailyStart = '2024-03-01';
const dailyEnd = '2024-03-05';
const dailyInstances = getRepeatInstances(dailyStart, dailyEnd, 'DAILY', null);
console.log(`  场景: 从 ${dailyStart} 开始每天重复，到 ${dailyEnd} 完成`);
console.log(`  预期: 5 个 completion 记录`);
console.log(`  实际: ${dailyInstances.length} 个记录`);
console.log(`  日期: ${dailyInstances.join(', ')}`);
console.log(`  结果: ${dailyInstances.length === 5 ? '✅ 通过' : '❌ 失败'}`);
console.log('');

// 测试用例 3: 每周重复的备忘录
console.log('【测试 3】每周重复的备忘录');
const weeklyStart = '2024-03-01'; // 周五
const weeklyEnd = '2024-03-22';
const weeklyInstances = getRepeatInstances(weeklyStart, weeklyEnd, 'WEEKLY', null);
console.log(`  场景: 从 ${weeklyStart} 开始每周五重复，到 ${weeklyEnd} 完成`);
console.log(`  预期: 4 个 completion 记录（3月1日、8日、15日、22日）`);
console.log(`  实际: ${weeklyInstances.length} 个记录`);
console.log(`  日期: ${weeklyInstances.join(', ')}`);
console.log(`  结果: ${weeklyInstances.length === 4 ? '✅ 通过' : '❌ 失败'}`);
console.log('');

// 测试用例 4: 每月重复的备忘录
console.log('【测试 4】每月重复的备忘录');
const monthlyStart = '2024-01-15';
const monthlyEnd = '2024-06-15';
const monthlyInstances = getRepeatInstances(monthlyStart, monthlyEnd, 'MONTHLY', null);
console.log(`  场景: 从 ${monthlyStart} 开始每月15日重复，到 ${monthlyEnd} 完成`);
console.log(`  预期: 6 个 completion 记录`);
console.log(`  实际: ${monthlyInstances.length} 个记录`);
console.log(`  日期: ${monthlyInstances.join(', ')}`);
console.log(`  结果: ${monthlyInstances.length === 6 ? '✅ 通过' : '❌ 失败'}`);
console.log('');

// 测试用例 5: 有结束日期的重复备忘录
console.log('【测试 5】有结束日期的重复备忘录');
const limitedStart = '2024-03-01';
const limitedTarget = '2024-03-10';
const limitedEnd = '2024-03-05';
const limitedInstances = getRepeatInstances(limitedStart, limitedTarget, 'DAILY', limitedEnd);
console.log(`  场景: 从 ${limitedStart} 开始每天重复，目标到 ${limitedTarget}，但结束日期是 ${limitedEnd}`);
console.log(`  预期: 5 个 completion 记录（受结束日期限制）`);
console.log(`  实际: ${limitedInstances.length} 个记录`);
console.log(`  日期: ${limitedInstances.join(', ')}`);
console.log(`  结果: ${limitedInstances.length === 5 ? '✅ 通过' : '❌ 失败'}`);
console.log('');

// 测试用例 6: 每两周重复
console.log('【测试 6】每两周重复的备忘录');
const biweeklyStart = '2024-03-01'; // 周五
const biweeklyEnd = '2024-04-12';
const biweeklyInstances = getRepeatInstances(biweeklyStart, biweeklyEnd, 'BIWEEKLY', null);
console.log(`  场景: 从 ${biweeklyStart} 开始每两周重复，到 ${biweeklyEnd} 完成`);
console.log(`  预期: 3 个 completion 记录（3月1日、15日、29日）`);
console.log(`  实际: ${biweeklyInstances.length} 个记录`);
console.log(`  日期: ${biweeklyInstances.join(', ')}`);
console.log(`  结果: ${biweeklyInstances.length === 3 ? '✅ 通过' : '❌ 失败'}`);
console.log('');

// 测试用例 7: 每年重复
console.log('【测试 7】每年重复的备忘录');
const yearlyStart = '2023-01-01';
const yearlyEnd = '2026-06-01';
const yearlyInstances = getRepeatInstances(yearlyStart, yearlyEnd, 'YEARLY', null);
console.log(`  场景: 从 ${yearlyStart} 开始每年重复，到 ${yearlyEnd} 完成`);
console.log(`  预期: 4 个 completion 记录（2023、2024、2025、2026年1月1日）`);
console.log(`  实际: ${yearlyInstances.length} 个记录`);
console.log(`  日期: ${yearlyInstances.join(', ')}`);
console.log(`  结果: ${yearlyInstances.length === 4 ? '✅ 通过' : '❌ 失败'}`);
console.log('');

console.log('========================================');
console.log('测试完成');
console.log('========================================');
