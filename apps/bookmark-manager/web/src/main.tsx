import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 监听 Portal 通过 postMessage 传递的 token
window.addEventListener('message', (event) => {
  if (event.data?.type === 'AUTH_TOKEN' && event.data.token) {
    const newToken = event.data.token
    const currentToken = localStorage.getItem('token')
    if (newToken !== currentToken) {
      localStorage.setItem('token', newToken)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        newValue: newToken,
        oldValue: currentToken,
      }))
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
