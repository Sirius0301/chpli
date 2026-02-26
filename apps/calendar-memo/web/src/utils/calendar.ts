import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, addWeeks, differenceInWeeks, differenceInMonths } from 'date-fns';
import { Solar, Lunar } from 'lunar-javascript';
import type { Memo, MemoWithInstance } from '@chpli/calendar-memo-shared';

/**
 * 获取周视图日期范围（周日开始）
 */
export function getWeekDays(currentDate: Date): Date[] {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // 周日开始
  const end = endOfWeek(currentDate, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * 获取月视图日期范围（包含前后月补齐的日期）
 */
export function getMonthDays(currentDate: Date): Date[][] {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  // 转为 6x7 二维数组（最多显示6周）
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

/**
 * 获取农历信息
 */
export function getLunarDate(date: Date): { month: string; day: string; jieQi?: string } {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();
  const jieQi = lunar.getJieQi();

  return {
    month,
    day,
    jieQi: jieQi || undefined,
  };
}

/**
 * 判断备忘录是否匹配目标日期（重复规则核心算法）
 */
export function isMemoMatchDate(memo: Memo, targetDate: Date): boolean {
  const start = new Date(memo.date);
  const target = new Date(targetDate);

  // 标准化为纯日期（去除时间部分）
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  // 检查是否在结束日期之后
  if (memo.repeatEndType === 'onDate' && memo.repeatEndDate) {
    const end = new Date(memo.repeatEndDate);
    end.setHours(0, 0, 0, 0);
    if (target > end) return false;
  }

  // 检查是否在开始日期之前
  if (target < start) return false;

  // 精确匹配原始日期
  if (isSameDay(target, start)) return true;

  // 不重复
  if (memo.repeatType === 'none') return false;

  switch (memo.repeatType) {
    case 'weekly':
      return target.getDay() === start.getDay() && 
             differenceInWeeks(target, start) % 1 === 0;

    case 'biweekly':
      return target.getDay() === start.getDay() && 
             differenceInWeeks(target, start) % 2 === 0;

    case 'monthly':
      return target.getDate() === start.getDate() &&
             differenceInMonths(target, start) % 1 === 0;

    case 'quarterly': // 每3个月
      return target.getDate() === start.getDate() && 
             differenceInMonths(target, start) % 3 === 0;

    case 'semiannual': // 每6个月
      return target.getDate() === start.getDate() && 
             differenceInMonths(target, start) % 6 === 0;

    case 'yearly':
      return target.getDate() === start.getDate() && 
             target.getMonth() === start.getMonth();

    default:
      return false;
  }
}

/**
 * 展开备忘录到指定日期范围的所有实例
 */
export function expandMemoToRange(
  memo: Memo, 
  rangeStart: Date, 
  rangeEnd: Date
): MemoWithInstance[] {
  const instances: MemoWithInstance[] = [];
  const start = new Date(memo.date);
  start.setHours(0, 0, 0, 0);

  // 检查范围内的每一天
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  for (const day of days) {
    if (isMemoMatchDate(memo, day)) {
      instances.push({
        ...memo,
        isRepeatInstance: !isSameDay(day, start),
        originalId: memo.id,
        instanceDate: format(day, 'yyyy-MM-dd'),
        date: format(day, 'yyyy-MM-dd'), // 覆盖为实例日期
      });
    }
  }

  return instances;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 解析 YYYY-MM-DD 为 Date
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00'); // 避免时区问题
}
