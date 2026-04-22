import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Bookmark } from 'lucide-react'

const BOOKMARK_URL = import.meta.env.VITE_BOOKMARK_URL || 'http://localhost:5174'

export const BookmarkFrame: React.FC = () => {
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
          <Bookmark className="w-4 h-4 mr-1.5 text-emerald-600" />
          Bookmark Manager
        </div>
        <div className="w-16" />
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={BOOKMARK_URL}
        className="flex-1 w-full border-0"
        title="Bookmark Manager"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
