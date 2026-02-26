import { useMemoStore } from '@/stores/memoStore';
import { getWeekDays, formatDate } from '@/utils/calendar';
import { DayCell } from './DayCell';
import { isSameDay, isToday } from 'date-fns';

export function WeekView() {
  const { selectedDate, expandedMemos } = useMemoStore();
  const weekDays = getWeekDays(selectedDate);

  const weekDays_zh = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays_cn = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 表头 */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day, index) => {
          const dayIsToday = isToday(day);
          return (
            <div 
              key={index} 
              className={`py-3 text-center border-r border-gray-200 last:border-r-0 transition-colors ${
                dayIsToday ? 'bg-green-100' : ''
              }`}
            >
              <div className={`text-xs mb-1 ${dayIsToday ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {weekDays_zh[index]}
              </div>
              <div className={`text-sm font-medium ${dayIsToday ? 'text-green-600' : 'text-gray-900'}`}>
                {formatDate(day).split('-')[2]}日
              </div>
              <div className={`text-xs mt-0.5 ${dayIsToday ? 'text-green-500' : 'text-gray-400'}`}>
                {weekDays_cn[index]}
              </div>
            </div>
          );
        })}
      </div>

      {/* 内容区 */}
      <div className="flex-1 grid grid-cols-7 divide-x divide-gray-200">
        {weekDays.map((day, index) => (
          <DayCell 
            key={index} 
            date={day} 
            memos={expandedMemos.filter(m => isSameDay(new Date(m.date), day))}
            isWeekView={true}
            isToday={isToday(day)}
          />
        ))}
      </div>
    </div>
  );
}
