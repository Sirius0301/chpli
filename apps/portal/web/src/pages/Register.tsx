import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserPlus, Mail, Phone, Lock, User, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { validatePassword, getPasswordStrength, isValidEmail, isValidPhone } from '@/utils/auth'
import axios from 'axios'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 密码强度
  const strength = getPasswordStrength(password)

  // 已登录则跳转
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true })
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [user, navigate])

  // 至少提供一个联系方式
  const hasContact = email.trim() || phone.trim()
  const startCountdown = () => {
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    setError('')
    if (!hasContact) {
      setError('请填写邮箱或手机号')
      return
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      setError('邮箱格式不正确')
      return
    }
    if (phone.trim() && !isValidPhone(phone.trim())) {
      setError('手机号格式不正确（11位，1开头）')
      return
    }

    try {
      const response = await axios.post('/api/auth/send-code', {
        ...(email.trim() && { email: email.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        type: 'REGISTER',
      })
      if (response.data.success) {
        startCountdown()
        // 开发环境 mock：后端会返回 code
        if (response.data.code) {
          setCode(response.data.code)
        }
      } else {
        setError(response.data.message || '发送失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 基础校验
    if (!hasContact) {
      setError('请填写邮箱或手机号至少一项')
      return
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      setError('邮箱格式不正确')
      return
    }
    if (phone.trim() && !isValidPhone(phone.trim())) {
      setError('手机号格式不正确')
      return
    }
    if (!name.trim()) {
      setError('请输入用户名')
      return
    }
    if (!code.trim() || code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      setError(pwdCheck.message!)
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post('/api/auth/register', {
        ...(email.trim() && { email: email.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        code,
        password,
        name: name.trim(),
      })
      if (response.data.success) {
        // 注册成功后自动登录
        const contact = email.trim() || phone.trim()
        await login(contact, password)
        navigate('/home')
      } else {
        setError(response.data.message || '注册失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chpli</h1>
          <p className="text-gray-500">个人生产力套件</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回登录
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">注册账号</h2>
            <div className="w-16" />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 <span className="text-gray-400 font-normal">（选填，与手机号至少填一个）</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号 <span className="text-gray-400 font-normal">（选填）</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="13800138000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                />
              </div>
            </div>

            {/* 验证码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="6位数字"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !hasContact}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap transition"
                >
                  {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                </button>
              </div>
              {code && (
                <p className="mt-1 text-xs text-green-600">
                  开发环境验证码已自动填充
                </p>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="请输入用户名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="至少8位，含字母、数字、特殊字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        strength.level === 1
                          ? 'bg-red-500 w-1/4'
                          : strength.level === 2
                          ? 'bg-yellow-500 w-2/4'
                          : strength.level === 3
                          ? 'bg-blue-500 w-3/4'
                          : 'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-medium transition"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
