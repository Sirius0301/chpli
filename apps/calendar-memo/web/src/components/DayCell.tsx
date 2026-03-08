import { useMemoStore } from '@/stores/memoStore';
import { getLunarDate } from '@/utils/calendar';
import { MemoItem } from './MemoItem';
import type { MemoWithInstance } from '@chpli/calendar-memo-shared';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useI18n, formatTemplate } from '@/i18n';

interface DayCellProps {
  date: Date;
  memos: MemoWithInstance[];
  isWeekView: boolean;
  isCurrentMonth?: boolean;
  isToday?: boolean;
}

// Sort memos: incomplete first, completed last
function sortMemos(memos: MemoWithInstance[]): MemoWithInstance[] {
  return [...memos].sort((a, b) => {
    const aCompleted = a.completed ? 1 : 0;
    const bCompleted = b.completed ? 1 : 0;
    return aCompleted - bCompleted;
  });
}

export function DayCell({ date, memos, isWeekView, isCurrentMonth = true, isToday = false }: DayCellProps) {
  const { t } = useI18n();
  const { setSelectedDate, openDetailPanel, selectMemo, isHighlightToday } = useMemoStore();
  
  const shouldHighlightMemos = isHighlightToday && isToday;
  const lunar = getLunarDate(date);

  // Sort and limit memos
  const { displayMemos, hasMore, remainingCount } = useMemo(() => {
    const sorted = sortMemos(memos);
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
        if ((e.target as HTMLElement).closest('.memo-item')) return;
        handleClick();
      }}
    >
      {/* Date Header */}
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

      {/* Memo List */}
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
            {formatTemplate(t.moreItems, { count: remainingCount })}
          </div>
        )}
      </div>

      {/* Hover border */}
      <div className="absolute inset-0 border-2 border-transparent hover:border-green-300 rounded pointer-events-none transition-colors" />
    </div>
  );
}
