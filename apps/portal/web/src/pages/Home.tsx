import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { CalendarDays, Bookmark, LogOut } from 'lucide-react'

export const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Chpli</h1>
            <p className="text-sm text-gray-500">欢迎回来，{user?.name || '用户'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">选择应用</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Calendar Memo */}
          <button
            onClick={() => navigate('/calendar')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-left shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Calendar Memo</h3>
              <p className="text-blue-100 leading-relaxed">
                日历备忘录，支持农历显示、重复提醒、标签分类和完成状态追踪。
                让每一天的任务都井井有条。
              </p>
              <div className="mt-6 flex items-center text-white font-medium">
                <span>进入应用</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Bookmark Manager */}
          <button
            onClick={() => navigate('/bookmark')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-left shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <Bookmark className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Bookmark Manager</h3>
              <p className="text-emerald-100 leading-relaxed">
                书签管理工具，支持标签分类、回收站、点击统计和导入导出。
                高效管理你的网络收藏。
              </p>
              <div className="mt-6 flex items-center text-white font-medium">
                <span>进入应用</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
