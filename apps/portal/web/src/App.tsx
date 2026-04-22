import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Home } from './pages/Home'
import { CalendarFrame } from './pages/CalendarFrame'
import { BookmarkFrame } from './pages/BookmarkFrame'

function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/calendar" element={<CalendarFrame />} />
          <Route path="/bookmark" element={<BookmarkFrame />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
