import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react'
import { detectContactType } from '@/utils/auth'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 已登录则跳转到 home
  React.useEffect(() => {
    if (user) {
      navigate('/home', { replace: true })
    }
  }, [user, navigate])

  const contactType = detectContactType(contact)
  const contactLabel = contactType === 'phone' ? '手机号' : contactType === 'email' ? '邮箱' : '邮箱/手机号'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!contact.trim()) {
      setError('请输入邮箱或手机号')
      return
    }

    const type = detectContactType(contact.trim())
    if (type === 'invalid' && contact.trim().length > 0) {
      // 允许尝试，后端会再次校验
    }

    setIsLoading(true)
    try {
      await login(contact.trim(), password)
      navigate('/home')
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chpli</h1>
          <p className="text-gray-500">个人生产力套件</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">登录</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                {contactLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="contact"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="请输入邮箱或手机号"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoComplete="username"
                />
              </div>
              {contact && contactType === 'invalid' && (
                <p className="mt-1 text-xs text-yellow-600">格式似乎不正确，但您可以尝试</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center transition"
              >
                注册账号
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
              <Link
                to="/reset-password"
                className="text-gray-500 hover:text-gray-700 transition"
              >
                忘记密码？
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-medium transition"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
