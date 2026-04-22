import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMemoStore } from '@/stores/memoStore';
import { useI18n } from '@/i18n';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DayView } from '@/components/DayView';
import { WeekView } from '@/components/WeekView';
import { MonthView } from '@/components/MonthView';
import { DetailPanel } from '@/components/DetailPanel';
import { requestNotificationPermission, startReminderCheck, stopReminderCheck } from '@/utils/notifications';

export const Home: React.FC = () => {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();
  const { 
    viewMode, 
    fetchMemos, 
    fetchTags, 
    isDetailPanelOpen,
    isSidebarOpen,
    isSidebarCollapsed,
    closeSidebar,
  } = useMemoStore();

  useEffect(() => {
    if (user) {
      fetchMemos();
      fetchTags();
      
      // 请求通知权限
      requestNotificationPermission();
    }
  }, [fetchMemos, fetchTags, user]);
  
  // 启动提醒检查 - 监听备忘录变化
  useEffect(() => {
    if (!user) return;
    
    startReminderCheck(() => {
      return useMemoStore.getState().expandedMemos.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        completed: m.completed,
        priority: m.priority,
      }));
    });
    
    return () => {
      stopReminderCheck();
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">{t.loading}</div>
      </div>
    );
  }

  // 未登录时重定向到登录页（Portal 入口）
  if (!user) {
    const portalUrl = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173'
    window.location.href = portalUrl
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 mb-2">{t.loading}</div>
          <p className="text-sm text-gray-400">正在跳转登录页...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar - Desktop: always visible, can be collapsed */}
        <div className={`
          hidden lg:block flex-shrink-0 h-full transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
        `}>
          <Sidebar />
        </div>

        {/* Sidebar - Mobile: overlay drawer */}
        {/* Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        {/* Mobile Sidebar Drawer */}
        <div className={`
          fixed inset-y-0 left-0 z-50 lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-2 sm:p-4">
            <div className={`min-w-[320px] ${viewMode === 'month' ? '' : 'h-full'}`}>
              {viewMode === 'day' ? <DayView /> : viewMode === 'week' ? <WeekView /> : <MonthView />}
            </div>
          </main>
        </div>

        {/* Detail Panel - Desktop: side panel, Mobile: overlay */}
        {isDetailPanelOpen && (
          <>
            {/* Mobile: full screen overlay with backdrop */}
            <div className="lg:hidden fixed inset-0 z-50">
              <div 
                className="absolute inset-0 bg-black/50"
                onClick={() => useMemoStore.getState().closeDetailPanel()}
              />
              <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-2xl shadow-2xl overflow-hidden">
                <DetailPanel />
              </div>
            </div>
            {/* Desktop: side panel */}
            <div className="hidden lg:block flex-shrink-0 h-full">
              <DetailPanel />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
