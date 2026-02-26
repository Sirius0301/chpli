import { useMemoStore } from '@/stores/memoStore';
import { getLunarDate, formatDate } from '@/utils/calendar';
import { MemoItem } from './MemoItem';
import type { MemoWithInstance } from '@chpli/calendar-memo-shared';
import { format } from 'date-fns';
import { useMemo } from 'react';

interface DayCellProps {
  date: Date;
  memos: MemoWithInstance[];
  isWeekView: boolean;
  isCurrentMonth?: boolean;
  isToday?: boolean;
}

// 排序备忘录：未完成的在前，已完成的在后
function sortMemos(memos: MemoWithInstance[]): MemoWithInstance[] {
  return [...memos].sort((a, b) => {
    // 未完成的排在前面（completed: false = 0, completed: true = 1）
    const aCompleted = a.completed ? 1 : 0;
    const bCompleted = b.completed ? 1 : 0;
    return aCompleted - bCompleted;
  });
}

export function DayCell({ date, memos, isWeekView, isCurrentMonth = true, isToday = false }: DayCellProps) {
  const { setSelectedDate, openDetailPanel, selectMemo, isHighlightToday } = useMemoStore();
  
  // 判断是否是今天的备忘录需要高亮
  const shouldHighlightMemos = isHighlightToday && isToday;
  const lunar = getLunarDate(date);

  // 对备忘录进行排序和限制
  const { displayMemos, hasMore, remainingCount } = useMemo(() => {
    const sorted = sortMemos(memos);
    // 周视图显示10条，月视图显示3条
    const displayLimit = isWeekView ? 10 : 3;
    const display = sorted.slice(0, displayLimit);
    return {
      displayMemos: display,
      hasMore: sorted.length > displayLimit,
      remainingCount: sorted.length - displayLimit,
    };
  }, [memos, isWeekView]);

  const handleClick = () => {
    setSelectedDate(date);
    selectMemo(null);
    openDetailPanel();
  };

  return (
    <div 
      className={`relative p-2 min-h-[120px] cursor-pointer transition-all duration-300 ${
        !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''
      } ${isToday ? 'bg-green-50' : ''} ${
        shouldHighlightMemos ? 'ring-2 ring-inset ring-green-400 bg-green-50' : 'hover:bg-gray-50'
      }`}
      onClick={(e) => {
        // 如果点击的是备忘录项，不触发单元格点击
        if ((e.target as HTMLElement).closest('.memo-item')) return;
        handleClick();
      }}
    >
      {/* 日期头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-semibold ${
            isToday ? 'text-green-600' : 'text-gray-900'
          } ${shouldHighlightMemos ? 'scale-110 inline-block' : ''}`}>
            {format(date, 'd')}
          </span>
          {!isWeekView && (
            <span className={`text-xs ${isToday ? 'text-green-500' : 'text-gray-500'}`}>
              {lunar.day}
            </span>
          )}
        </div>
        {lunar.jieQi && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            isToday ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {lunar.jieQi}
          </span>
        )}
      </div>

      {/* 备忘录列表 */}
      <div className={`space-y-1 transition-all duration-300 ${
        shouldHighlightMemos && memos.length > 0 
          ? 'p-1.5 rounded-lg ring-2 ring-green-400 bg-white shadow-sm' 
          : ''
      }`}>
        {displayMemos.map((memo) => (
          <MemoItem 
            key={`${memo.id}-${memo.instanceDate || memo.date}`} 
            memo={memo} 
            isHighlighted={shouldHighlightMemos}
          />
        ))}
        {hasMore && (
          <div className="text-xs text-gray-400 px-2 py-1">
            +{remainingCount} 更多
          </div>
        )}
      </div>

      {/* 悬停添加按钮 */}
      <div className="absolute inset-0 border-2 border-transparent hover:border-green-300 rounded pointer-events-none transition-colors" />
    </div>
  );
}
