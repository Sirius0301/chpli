import { useMemoStore } from '@/stores/memoStore';
import { format, isSameDay } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { MemoItem } from './MemoItem';
import { getLunarDate } from '@/utils/calendar';
import { useMemo } from 'react';
import { useI18n, formatTemplate } from '@/i18n';
import type { MemoWithInstance } from '@chpli/calendar-memo-shared';

// Sort memos: incomplete first, completed last
function sortMemos(memos: MemoWithInstance[]): MemoWithInstance[] {
  return [...memos].sort((a, b) => {
    const aCompleted = a.completed ? 1 : 0;
    const bCompleted = b.completed ? 1 : 0;
    return aCompleted - bCompleted;
  });
}

export function DayView() {
  const { t, language } = useI18n();
  const locale = language === 'zh' ? zhCN : enUS;
  const { 
    selectedDate, 
    expandedMemos, 
    isHighlightToday,
    setSelectedDate,
    openDetailPanel,
    selectMemo,
  } = useMemoStore();

  // Filter memos for selected date
  const { displayMemos, hasMore, totalCount } = useMemo(() => {
    const dayMemos = expandedMemos.filter(m => {
      const memoDate = new Date(m.date);
      return (
        memoDate.getFullYear() === selectedDate.getFullYear() &&
        memoDate.getMonth() === selectedDate.getMonth() &&
        memoDate.getDate() === selectedDate.getDate()
      );
    });

    const sorted = sortMemos(dayMemos);
    const limit = 10;
    const display = sorted.slice(0, limit);
    
    return {
      displayMemos: display,
      hasMore: sorted.length > limit,
      totalCount: sorted.length,
    };
  }, [expandedMemos, selectedDate]);

  // Get lunar date
  const lunarDate = getLunarDate(selectedDate);
  const lunarDisplay = lunarDate.jieQi 
    ? formatTemplate(t.lunarDateWithJieQi, { month: lunarDate.month, day: lunarDate.day, jieQi: lunarDate.jieQi })
    : formatTemplate(t.lunarDate, { month: lunarDate.month, day: lunarDate.day });

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const shouldHighlightMemos = isHighlightToday && isToday;

  // Handle click on empty area to create memo
  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.memo-item')) return;
    setSelectedDate(selectedDate);
    selectMemo(null);
    openDetailPanel();
  };

  return (
    <div 
      className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden"
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className={`py-4 px-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white ${
        shouldHighlightMemos ? 'ring-2 ring-green-400 ring-inset' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium ${isToday ? 'text-green-600' : 'text-gray-500'}`}>
              {isToday ? 'Today' : format(selectedDate, 'EEEE', { locale })}
            </div>
            <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-green-700' : 'text-gray-900'}`}>
              {format(selectedDate, t.dateFormatDay, { locale })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {lunarDisplay}
            </div>
          </div>
          <div className={`text-5xl font-bold ${isToday ? 'text-green-500' : 'text-gray-200'}`}>
            {selectedDate.getDate()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-auto p-4 ${
        shouldHighlightMemos ? 'bg-green-50/30' : ''
      }`}>
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">{t.noMemosToday}</p>
            <p className="text-sm mt-1">{t.clickToAdd}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-3">
              {formatTemplate(t.totalMemos, { count: totalCount })}
              {hasMore && formatTemplate(t.showingFirst, { count: 10 })}
            </div>
            <div className={`space-y-2 ${shouldHighlightMemos ? 'p-2 rounded-lg ring-2 ring-green-400 ring-offset-1 bg-white' : ''}`}>
              {displayMemos.map((memo) => (
                <MemoItem 
                  key={`${memo.id}-${memo.instanceDate || memo.date}`} 
                  memo={memo} 
                  isHighlighted={shouldHighlightMemos}
                />
              ))}
            </div>
            {hasMore && (
              <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                {formatTemplate(t.moreItems, { count: totalCount - 10 })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
