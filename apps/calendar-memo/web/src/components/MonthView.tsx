import { useMemoStore } from '@/stores/memoStore';
import { getMonthDays } from '@/utils/calendar';
import { DayCell } from './DayCell';
import { isSameDay, isToday, format } from 'date-fns';
import { useI18n } from '@/i18n';

export function MonthView() {
  const { t } = useI18n();
  const { selectedDate, expandedMemos } = useMemoStore();
  const monthWeeks = getMonthDays(selectedDate);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {t.weekDaysShort.map((day, index) => (
          <div 
            key={index} 
            className="py-2 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="flex-1 flex flex-col divide-y divide-gray-200">
        {monthWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex-1 grid grid-cols-7 divide-x divide-gray-200 min-h-0">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = format(day, 'M') === format(selectedDate, 'M');
              const dayIsToday = isToday(day);

              return (
                <DayCell 
                  key={dayIndex} 
                  date={day} 
                  memos={expandedMemos.filter(m => isSameDay(new Date(m.date), day))}
                  isWeekView={false}
                  isCurrentMonth={isCurrentMonth}
                  isToday={dayIsToday}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
