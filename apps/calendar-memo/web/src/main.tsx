import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { I18nProvider } from '@/i18n';

// 监听 Portal 通过 postMessage 传递的 token
window.addEventListener('message', (event) => {
  if (event.data?.type === 'AUTH_TOKEN' && event.data.token) {
    localStorage.setItem('token', event.data.token);
    // 触发应用重新读取 token（通过页面刷新或自定义事件）
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'token',
      newValue: event.data.token,
    }));
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
