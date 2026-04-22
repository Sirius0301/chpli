import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 监听 Portal 通过 postMessage 传递的 token
window.addEventListener('message', (event) => {
  if (event.data?.type === 'AUTH_TOKEN' && event.data.token) {
    localStorage.setItem('token', event.data.token)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'token',
      newValue: event.data.token,
    }))
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
