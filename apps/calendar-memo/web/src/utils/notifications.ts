// 浏览器通知服务

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// 发送通知
export function sendNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const defaultOptions: NotificationOptions = {
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'calendar-memo',
    requireInteraction: false,
  };

  const notification = new Notification(title, { ...defaultOptions, ...options });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

// 检查即将到来的事项并发送通知
export function checkUpcomingMemos(memos: Array<{
  id: string;
  title: string;
  date: string;
  completed: boolean;
  priority?: string;
}>): void {
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentHour = now.getHours();

  memos.forEach(memo => {
    if (memo.completed) return;

    const memoDate = new Date(memo.date);
    const memoDay = new Date(memoDate.getFullYear(), memoDate.getMonth(), memoDate.getDate());
    
    const diffTime = memoDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 今天的事项 - 早上9点提醒
    if (diffDays === 0 && currentHour === 9) {
      const priorityText = memo.priority === 'high' ? '【高优先级】' : '';
      sendNotification(`${priorityText}今天: ${memo.title}`, {
        body: '点击打开查看详情',
        tag: `memo-${memo.id}-today`,
      });
    }
    
    // 明天的事项 - 晚上8点提醒
    if (diffDays === 1 && currentHour === 20) {
      sendNotification(`明天: ${memo.title}`, {
        body: '别忘了明天的安排',
        tag: `memo-${memo.id}-tomorrow`,
      });
    }

    // 高优先级事项 - 提前1天早上提醒
    if (diffDays === 1 && memo.priority === 'high' && currentHour === 8) {
      sendNotification(`【重要】明天: ${memo.title}`, {
        body: '这是高优先级事项，请提前准备',
        tag: `memo-${memo.id}-important`,
        requireInteraction: true,
      });
    }
  });
}

// 定时检查器
let checkInterval: number | null = null;

export function startReminderCheck(memosGetter: () => Array<{
  id: string;
  title: string;
  date: string;
  completed: boolean;
  priority?: string;
}>): void {
  // 每分钟检查一次
  checkInterval = window.setInterval(() => {
    checkUpcomingMemos(memosGetter());
  }, 60000);
}

export function stopReminderCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
