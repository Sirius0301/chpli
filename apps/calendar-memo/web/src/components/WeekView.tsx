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
              <div className={`text-xs mb-1 ${dayIsToday ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {t.weekDaysShort[index]}
              </div>
              <div className={`text-sm font-medium ${dayIsToday ? 'text-green-600' : 'text-gray-900'}`}>
                {formatDate(day).split('-')[2]}{language === 'zh' ? '日' : ''}
              </div>
              <div className={`text-xs mt-0.5 ${dayIsToday ? 'text-green-500' : 'text-gray-400'}`}>
                {t.weekDays[index]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
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
