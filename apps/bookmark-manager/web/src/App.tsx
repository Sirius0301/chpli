import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import RecycleBinPage from '@/pages/RecycleBinPage'

const queryClient = new QueryClient()

function AuthGuard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-2">等待认证...</div>
          <p className="text-sm text-gray-400">请从 Portal 登录后访问</p>
        </div>
      </div>
    )
  }

  return <Layout />
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/recycle-bin" element={<RecycleBinPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  )
}
