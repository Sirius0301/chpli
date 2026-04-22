import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: string
  email: string | null
  phone: string | null
  name: string
  isActive: boolean
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  const applyToken = (t: string) => {
    localStorage.setItem('token', t)
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
  }

  const clearToken = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const fetchUser = async (t: string) => {
    try {
      applyToken(t)
      const response = await axios.get('/api/auth/me')
      if (response.data.success) {
        setUser(response.data.data)
      } else {
        clearToken()
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      clearToken()
      setUser(null)
    }
  }

  // 初始化：检查 localStorage 中已有 token
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        await fetchUser(savedToken)
      }
      setIsLoading(false)
    }
    init()
  }, [])

  // 监听 Portal 通过 postMessage 传递的 token
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.source !== window.parent) return
      const { type, token: newToken } = event.data || {}
      if (type === 'AUTH_TOKEN' && newToken && newToken !== token) {
        await fetchUser(newToken)
        setToken(newToken)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [token])

  // 监听 localStorage 变化（main.tsx 中 postMessage 会触发 storage 事件）
  useEffect(() => {
    const handleStorage = async (event: StorageEvent) => {
      if (event.key === 'token') {
        const newToken = event.newValue
        if (newToken && newToken !== token) {
          await fetchUser(newToken)
          setToken(newToken)
        } else if (!newToken && token) {
          clearToken()
          setUser(null)
          setToken(null)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [token])

  const logout = () => {
    clearToken()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
