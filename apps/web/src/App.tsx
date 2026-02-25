import { useEffect } from 'react';
import { useMemoStore } from '@/stores/memoStore';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { WeekView } from '@/components/WeekView';
import { MonthView } from '@/components/MonthView';
import { DetailPanel } from '@/components/DetailPanel';

function App() {
  const { 
    viewMode, 
    fetchMemos, 
    fetchTags, 
    isDetailPanelOpen,
  } = useMemoStore();

  useEffect(() => {
    fetchMemos();
    fetchTags();
  }, [fetchMemos, fetchTags]);

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50">
        {/* 左侧边栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto p-4">
            {viewMode === 'week' ? <WeekView /> : <MonthView />}
          </main>
        </div>

        {/* 右侧详情面板 */}
        {isDetailPanelOpen && (
          <DetailPanel />
        )}
      </div>
    </Layout>
  );
}

export default App;
