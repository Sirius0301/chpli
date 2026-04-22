import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, CalendarDays } from 'lucide-react'

const CALENDAR_URL = import.meta.env.VITE_CALENDAR_URL || 'http://localhost:5175'

export const CalendarFrame: React.FC = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !token) return

    const handleLoad = () => {
      try {
        iframe.contentWindow?.postMessage(
          { type: 'AUTH_TOKEN', token },
          '*'
        )
      } catch {
        // ignore cross-origin errors
      }
    }

    iframe.addEventListener('load', handleLoad)
    // 部分浏览器缓存可能导致 load 不触发，额外定时发送
    const timer = setInterval(() => {
      try {
        iframe.contentWindow?.postMessage(
          { type: 'AUTH_TOKEN', token },
          '*'
        )
      } catch {
        // ignore
      }
    }, 2000)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      clearInterval(timer)
    }
  }, [token])

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b flex items-center px-4 justify-between shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回首页
        </button>
        <div className="flex items-center text-sm font-medium text-gray-800">
          <CalendarDays className="w-4 h-4 mr-1.5 text-blue-600" />
          Calendar Memo
        </div>
        <div className="w-16" />
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={CALENDAR_URL}
        className="flex-1 w-full border-0"
        title="Calendar Memo"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
