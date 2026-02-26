import { useMemoStore } from '@/stores/memoStore';
import { format, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MemoItem } from './MemoItem';
import { getLunarDate } from '@/utils/calendar';
import { useMemo } from 'react';
import type { MemoWithInstance } from '@chpli/calendar-memo-shared';

// 排序备忘录：未完成的在前，已完成的在后
function sortMemos(memos: MemoWithInstance[]): MemoWithInstance[] {
  return [...memos].sort((a, b) => {
    // 未完成的排在前面（completed: false = 0, completed: true = 1）
    const aCompleted = a.completed ? 1 : 0;
    const bCompleted = b.completed ? 1 : 0;
    return aCompleted - bCompleted;
  });
}

export function DayView() {
  const { 
    selectedDate, 
    expandedMemos, 
    isHighlightToday,
    setSelectedDate,
    openDetailPanel,
    selectMemo,
  } = useMemoStore();

  // 只显示选中日期的备忘录，并进行排序和限制
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

  // 获取农历日期
  const lunarDate = getLunarDate(selectedDate);
  const lunarDisplay = lunarDate.jieQi 
    ? `${lunarDate.month}月${lunarDate.day} (${lunarDate.jieQi})`
    : `${lunarDate.month}月${lunarDate.day}`;

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  // 判断是否要高亮今天的备忘录（只有当选择的日期是今天且 isHighlightToday 为 true 时）
  const shouldHighlightMemos = isHighlightToday && isToday;

  // 处理点击空白区域创建备忘录
  const handleContainerClick = (e: React.MouseEvent) => {
    // 如果点击的是备忘录项，不触发创建
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
      {/* 表头 */}
      <div className={`py-4 px-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white ${
        shouldHighlightMemos ? 'ring-2 ring-green-400 ring-inset' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium ${isToday ? 'text-green-600' : 'text-gray-500'}`}>
              {isToday ? 'Today' : format(selectedDate, 'EEEE', { locale: zhCN })}
            </div>
            <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-green-700' : 'text-gray-900'}`}>
              {format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              农历 {lunarDisplay}
            </div>
          </div>
          <div className={`text-5xl font-bold ${isToday ? 'text-green-500' : 'text-gray-200'}`}>
            {selectedDate.getDate()}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className={`flex-1 overflow-auto p-4 ${
        shouldHighlightMemos ? 'bg-green-50/30' : ''
      }`}>
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">今天没有备忘录</p>
            <p className="text-sm mt-1">点击此处添加新备忘录</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-3">
              共 {totalCount} 个备忘录
              {hasMore && `（显示前 10 个）`}
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
                +{totalCount - 10} 更多
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
