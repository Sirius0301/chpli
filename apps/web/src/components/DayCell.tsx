import { useMemoStore } from '@/stores/memoStore';
import { getLunarDate, formatDate } from '@/utils/calendar';
import { MemoItem } from './MemoItem';
import type { MemoWithInstance } from '@calendar-memo/types';
import { format } from 'date-fns';

interface DayCellProps {
  date: Date;
  memos: MemoWithInstance[];
  isWeekView: boolean;
  isCurrentMonth?: boolean;
  isToday?: boolean;
}

export function DayCell({ date, memos, isWeekView, isCurrentMonth = true, isToday = false }: DayCellProps) {
  const { setSelectedDate, openDetailPanel, selectMemo } = useMemoStore();
  const lunar = getLunarDate(date);

  const handleClick = () => {
    setSelectedDate(date);
    selectMemo(null);
    openDetailPanel();
  };

  // 显示限制：周视图最多显示 4 条，月视图最多显示 3 条
  const displayLimit = isWeekView ? 4 : 3;
  const displayMemos = memos.slice(0, displayLimit);
  const hasMore = memos.length > displayLimit;

  return (
    <div 
      className={`relative p-2 min-h-[120px] cursor-pointer transition-colors hover:bg-gray-50 ${
        !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''
      } ${isToday ? 'bg-green-50/30' : ''}`}
      onClick={(e) => {
        // 如果点击的是备忘录项，不触发单元格点击
        if ((e.target as HTMLElement).closest('.memo-item')) return;
        handleClick();
      }}
    >
      {/* 日期头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-semibold ${isToday ? 'text-green-600' : 'text-gray-900'}`}>
            {format(date, 'd')}
          </span>
          {!isWeekView && (
            <span className="text-xs text-gray-500">
              {lunar.day}
            </span>
          )}
        </div>
        {lunar.jieQi && (
          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
            {lunar.jieQi}
          </span>
        )}
      </div>

      {/* 备忘录列表 */}
      <div className="space-y-1">
        {displayMemos.map((memo) => (
          <MemoItem key={`${memo.id}-${memo.instanceDate || memo.date}`} memo={memo} />
        ))}
        {hasMore && (
          <div className="text-xs text-gray-400 px-2 py-1">
            +{memos.length - displayLimit} 更多
          </div>
        )}
      </div>

      {/* 悬停添加按钮 */}
      <div className="absolute inset-0 border-2 border-transparent hover:border-green-300 rounded pointer-events-none transition-colors" />
    </div>
  );
}
