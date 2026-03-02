import { useMemoStore } from '@/stores/memoStore';
import { useAuth } from '@/contexts/AuthContext';
import { format, addWeeks, addMonths, subWeeks, subMonths, addDays, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function Header() {
  const { user, logout } = useAuth();
  const { 
    viewMode, 
    setViewMode, 
    selectedDate, 
    setSelectedDate,
    selectToday,
    openDetailPanel,
    selectMemo,
  } = useMemoStore();

  const handlePrev = () => {
    if (viewMode === 'day') {
      setSelectedDate(subDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const handleToday = () => {
    selectToday();
  };

  const handleCreate = () => {
    selectMemo(null);
    openDetailPanel();
  };

  const getDateDisplay = () => {
    if (viewMode === 'day') {
      return format(selectedDate, 'yyyy年M月d日', { locale: zhCN });
    } else if (viewMode === 'week') {
      return `${format(selectedDate, 'yyyy')}年第${format(selectedDate, 'w')}周`;
    } else {
      return format(selectedDate, 'yyyy年M月', { locale: zhCN });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：导航按钮 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* 上一个 */}
            <button 
              onClick={handlePrev}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Today 按钮 */}
            <button 
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors shadow-sm"
            >
              Today
            </button>

            {/* 下一个 */}
            <button 
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 min-w-[150px]">
            {getDateDisplay()}
          </h1>
        </div>

        {/* 中间：视图切换 */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'day' 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'week' 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'month' 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month
          </button>
        </div>

        {/* 右侧：用户信息和操作 */}
        <div className="flex items-center gap-4">
          {/* 新建备忘录按钮 */}
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建备忘录
          </button>

          {/* 用户信息 */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="退出登录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
