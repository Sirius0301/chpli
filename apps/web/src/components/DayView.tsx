import { useMemoStore } from '@/stores/memoStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MemoItem } from './MemoItem';
import { getLunarDate } from '@/utils/calendar';

export function DayView() {
  const { selectedDate, expandedMemos, isHighlightToday } = useMemoStore();

  // 只显示选中日期的备忘录
  const dayMemos = expandedMemos.filter(m => {
    const memoDate = new Date(m.date);
    return (
      memoDate.getFullYear() === selectedDate.getFullYear() &&
      memoDate.getMonth() === selectedDate.getMonth() &&
      memoDate.getDate() === selectedDate.getDate()
    );
  });

  // 获取农历日期
  const lunarDate = getLunarDate(selectedDate);
  const lunarDisplay = lunarDate.jieQi 
    ? `${lunarDate.month}月${lunarDate.day} (${lunarDate.jieQi})`
    : `${lunarDate.month}月${lunarDate.day}`;

  const isToday = (() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  })();

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 表头 */}
      <div className="py-4 px-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
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
      <div className="flex-1 overflow-auto p-4">
        {dayMemos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">今天没有备忘录</p>
            <p className="text-sm mt-1">点击右上角按钮添加新备忘录</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-3">
              共 {dayMemos.length} 个备忘录
            </div>
            {dayMemos.map((memo) => (
              <MemoItem 
                key={`${memo.id}-${memo.instanceDate || memo.date}`} 
                memo={memo} 
                isHighlighted={isHighlightToday && isToday}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
