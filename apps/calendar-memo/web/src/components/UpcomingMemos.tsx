import { useMemo, useEffect, useState } from 'react';
import { useMemoStore } from '@/stores/memoStore';
import { useI18n } from '@/i18n';
import { format, differenceInDays, isToday, isTomorrow, addDays, isAfter, isBefore } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

// 提醒类型
interface Reminder {
  memoId: string;
  title: string;
  date: Date;
  priority?: 'high' | 'medium' | 'low';
  daysUntil: number;
  isUrgent: boolean;
}

export function UpcomingMemos() {
  const { t, language } = useI18n();
  const { expandedMemos, setSelectedDate, selectMemo, openDetailPanel } = useMemoStore();
  const [now, setNow] = useState(new Date());
  
  const locale = language === 'zh' ? zhCN : enUS;

  // 每分钟刷新一次
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 获取即将到来的备忘录 (未来7天)
  const upcomingMemos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = addDays(today, 7);
    
    const reminders: Reminder[] = [];
    
    expandedMemos.forEach(memo => {
      if (memo.completed) return; // 跳过已完成的
      
      const memoDate = new Date(memo.date);
      memoDate.setHours(0, 0, 0, 0);
      
      // 只显示今天及未来7天的
      if (isBefore(memoDate, today)) return;
      if (isAfter(memoDate, nextWeek)) return;
      
      const daysUntil = differenceInDays(memoDate, today);
      const isUrgent = daysUntil === 0 || (daysUntil === 1 && memo.priority === 'high');
      
      reminders.push({
        memoId: memo.id,
        title: memo.title,
        date: memoDate,
        priority: memo.priority,
        daysUntil,
        isUrgent,
      });
    });
    
    // 按紧急程度和日期排序
    return reminders.sort((a, b) => {
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return -1;
      return a.daysUntil - b.daysUntil;
    }).slice(0, 5); // 最多显示5个
  }, [expandedMemos, now]);

  if (upcomingMemos.length === 0) return null;

  const handleClick = (memo: Reminder) => {
    setSelectedDate(memo.date);
    selectMemo(memo.memoId);
    openDetailPanel();
  };

  const getTimeLabel = (daysUntil: number) => {
    if (daysUntil === 0) return language === 'zh' ? '今天' : 'Today';
    if (daysUntil === 1) return language === 'zh' ? '明天' : 'Tomorrow';
    if (daysUntil === 2) return language === 'zh' ? '后天' : 'In 2 days';
    return language === 'zh' ? `${daysUntil}天后` : `In ${daysUntil} days`;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-orange-800">
          {language === 'zh' ? '即将到期' : 'Upcoming'}
        </h3>
        <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
          {upcomingMemos.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {upcomingMemos.map((memo) => (
          <button
            key={`${memo.memoId}-${memo.date.toISOString()}`}
            onClick={() => handleClick(memo)}
            className={`
              w-full text-left p-2 rounded-lg transition-all
              ${memo.isUrgent 
                ? 'bg-red-100 hover:bg-red-200 border border-red-200' 
                : 'bg-white hover:bg-orange-100 border border-transparent'
              }
            `}
          >
            <div className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(memo.priority)}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${memo.isUrgent ? 'font-medium text-red-900' : 'text-gray-800'}`}>
                  {memo.title}
                </div>
                <div className={`text-xs mt-0.5 ${memo.isUrgent ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {getTimeLabel(memo.daysUntil)}
                  {memo.daysUntil === 0 && (
                    <span className="ml-1 animate-pulse">⚠️</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
