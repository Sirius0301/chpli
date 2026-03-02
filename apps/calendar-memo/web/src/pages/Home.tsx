import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMemoStore } from '@/stores/memoStore';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DayView } from '@/components/DayView';
import { WeekView } from '@/components/WeekView';
import { MonthView } from '@/components/MonthView';
import { DetailPanel } from '@/components/DetailPanel';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { 
    viewMode, 
    fetchMemos, 
    fetchTags, 
    isDetailPanelOpen,
  } = useMemoStore();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMemos();
      fetchTags();
    }
  }, [fetchMemos, fetchTags, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50">
        {/* 左侧边栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto p-4">
            {viewMode === 'day' ? <DayView /> : viewMode === 'week' ? <WeekView /> : <MonthView />}
          </main>
        </div>

        {/* 右侧详情面板 */}
        {isDetailPanelOpen && (
          <DetailPanel />
        )}
      </div>
    </Layout>
  );
};
