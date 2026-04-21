import { useMemoStore } from '@/stores/memoStore';
import { getWeekDays, formatDate } from '@/utils/calendar';
import { DayCell } from './DayCell';
import { isSameDay, isToday } from 'date-fns';
import { useI18n } from '@/i18n';

export function WeekView() {
  const { t, language } = useI18n();
  const { selectedDate, expandedMemos } = useMemoStore();
  const weekDays = getWeekDays(selectedDate);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
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
              <div className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 ${dayIsToday ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {t.weekDaysShort[index]}
              </div>
              <div className={`text-sm sm:text-base font-medium ${dayIsToday ? 'text-green-600' : 'text-gray-900'}`}>
                {formatDate(day).split('-')[2]}{language === 'zh' ? '' : ''}
              </div>
              <div className={`hidden sm:block text-xs mt-0.5 ${dayIsToday ? 'text-green-500' : 'text-gray-400'}`}>
                {t.weekDays[index]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-7 grid-rows-1 divide-x divide-gray-200">
        {weekDays.map((day, index) => {
          const dayMemos = expandedMemos.filter(m => {
            const memoDate = new Date(m.date);
            const match = isSameDay(memoDate, day);
            console.log(`[WeekView] Day ${index}: memo.date=${m.date}, match=${match}`);
            return match;
          });
          console.log(`[WeekView] Day ${index} (${day.toISOString()}): ${dayMemos.length} memos`);
          return (
            <DayCell 
              key={index} 
              date={day} 
              memos={dayMemos}
              isWeekView={true}
              isToday={isToday(day)}
            />
          );
        })}
      </div>
    </div>
  );
}
