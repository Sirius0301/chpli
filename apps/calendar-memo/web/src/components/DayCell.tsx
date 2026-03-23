import { useMemoStore } from '@/stores/memoStore';
import { getLunarDate } from '@/utils/calendar';
import { MemoItem } from './MemoItem';
import type { MemoWithInstance } from '../types';
import { format, differenceInDays, isSameDay } from 'date-fns';
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
  const { t, language } = useI18n();
  const { setSelectedDate, openDetailPanel, selectMemo, isHighlightToday } = useMemoStore();
  
  const shouldHighlightMemos = isHighlightToday && isToday;
  const lunar = getLunarDate(date);
  
  // 计算紧急程度
  const urgencyInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(date);
    cellDate.setHours(0, 0, 0, 0);
    
    const daysDiff = differenceInDays(cellDate, today);
    
    // 检查是否有高优先级未完成事项
    const hasHighPriority = memos.some(m => !m.completed && m.priority === 'high');
    const hasUncompleted = memos.some(m => !m.completed);
    
    const today2 = new Date();
    const tomorrow2 = new Date(today2);
    tomorrow2.setDate(tomorrow2.getDate() + 1);
    
    if (isSameDay(date, today2) && hasHighPriority) {
      return { level: 'urgent', label: language === 'zh' ? '今' : 'TD', color: 'bg-red-500' };
    }
    if (isSameDay(date, today2) && hasUncompleted) {
      return { level: 'today', label: language === 'zh' ? '今' : 'TD', color: 'bg-orange-500' };
    }
    if (isSameDay(date, tomorrow2) && hasHighPriority) {
      return { level: 'tomorrow-important', label: language === 'zh' ? '明' : 'TM', color: 'bg-yellow-500' };
    }
    if (daysDiff > 0 && daysDiff <= 3 && hasHighPriority) {
      return { level: 'soon', label: `${daysDiff}d`, color: 'bg-blue-500' };
    }
    return null;
  }, [date, memos, language]);

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
      className={`relative p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] cursor-pointer transition-all duration-300 ${
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
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className={`text-sm sm:text-lg font-semibold ${
            isToday ? 'text-green-600' : 'text-gray-900'
          } ${shouldHighlightMemos ? 'scale-110 inline-block' : ''}`}>
            {format(date, 'd')}
          </span>
          {!isWeekView && (
            <span className={`hidden sm:inline text-xs ${isToday ? 'text-green-500' : 'text-gray-500'}`}>
              {lunar.day}
            </span>
          )}
        </div>
        {/* 紧急程度标记 - 优先显示 */}
        {urgencyInfo ? (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium ${urgencyInfo.color}`}>
            {urgencyInfo.label}
          </span>
        ) : lunar.jieQi && (
          <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded ${
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
