import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_HOME') {
        navigate('/home')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  return (
    <div className="h-screen flex flex-col">
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
