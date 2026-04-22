import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Home } from './pages/Home'
import { CalendarFrame } from './pages/CalendarFrame'
import { BookmarkFrame } from './pages/BookmarkFrame'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/calendar" element={<CalendarFrame />} />
        <Route path="/bookmark" element={<BookmarkFrame />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
