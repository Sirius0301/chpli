# Calendar Memo 前端开发指南

## 🚀 快速开始

```bash
# 进入前端目录
cd apps/calendar-memo/web

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

开发服务器运行在 `http://localhost:5173`

---

## 📁 目录结构

```
web/src/
├── main.tsx                 # 应用入口
├── App.tsx                  # 根组件
├── index.css                # 全局样式
│
├── components/              # React 组件
│   ├── Layout.tsx           # 整体布局
│   ├── Sidebar.tsx          # 左侧边栏（标签筛选）
│   ├── Header.tsx           # 顶部导航（视图切换）
│   ├── WeekView.tsx         # 周视图
│   ├── MonthView.tsx        # 月视图
│   ├── DayView.tsx          # 日视图
│   ├── DayCell.tsx          # 日期单元格
│   ├── MemoItem.tsx         # 备忘录条目
│   ├── DetailPanel.tsx      # 右侧详情/编辑面板
│   └── ...
│
├── stores/                  # Zustand 状态管理
│   └── memoStore.ts         # 全局状态
│
├── utils/                   # 工具函数
│   ├── api.ts               # API 客户端
│   ├── calendar.ts          # 日期计算（农历、重复规则）
│   └── auth.ts              # 认证工具（新增）
│
└── types/                   # 类型定义
    ├── index.ts             # 基础类型
    └── lunar-javascript.d.ts # 农历库类型声明
```

---

## 🔐 认证集成

### 1. 登录状态管理

```typescript
// stores/authStore.ts（建议创建）
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      setToken: (token) => set({ token, isLoggedIn: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isLoggedIn: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 2. API 请求带 Token

```typescript
// utils/api.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器添加 Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器处理 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. 受保护路由

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

---

## 🎨 组件开发规范

### 1. 组件文件结构

```typescript
// 1. 导入
import { useState } from 'react';
import { useMemoStore } from '@/stores/memoStore';

// 2. Props 类型定义
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. 组件实现
export function Component({ title, onAction }: ComponentProps) {
  // 状态
  const [count, setCount] = useState(0);
  
  // Store
  const { selectedDate } = useMemoStore();
  
  // 处理函数
  const handleClick = () => {
    setCount(c => c + 1);
    onAction();
  };
  
  // 渲染
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
}
```

### 2. 样式规范

使用 TailwindCSS，遵循以下约定：

```tsx
// ✅ 使用语义化类名
<button className="
  px-4 py-2
  bg-green-500 hover:bg-green-600
  text-white font-medium
  rounded-lg
  transition-colors
  disabled:opacity-50
">
  提交
</button>

// ✅ 使用 cn 工具合并类名
import { cn } from '@/utils/cn';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isLarge && "large-classes"
)} />
```

### 3. 类型导入

```typescript
// ✅ 使用路径别名
import type { Memo } from '@chpli/calendar-memo-shared';
import { api } from '@/utils/api';
import { useMemoStore } from '@/stores/memoStore';
```

---

## 📡 API 调用示例

### 登录

```typescript
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/utils/api';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setToken = useAuthStore((state) => state.setToken);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      const { token, user } = response.data.data;
      setToken(token);
      // 跳转到首页
    } catch (error) {
      alert(error.response?.data?.message || '登录失败');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 获取备忘录列表

```typescript
import { useEffect } from 'react';
import { useMemoStore } from '@/stores/memoStore';
import api from '@/utils/api';

function MemoList() {
  const { memos, setMemos } = useMemoStore();
  
  useEffect(() => {
    const fetchMemos = async () => {
      const response = await api.get('/memos', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });
      setMemos(response.data.data);
    };
    
    fetchMemos();
  }, []);
  
  return <div>{memos.map(memo => <MemoItem key={memo.id} memo={memo} />)}</div>;
}
```

---

## 🔧 开发工具

### 推荐 VSCode 插件

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Tailwind CSS IntelliSense** - Tailwind 智能提示
- **TypeScript Importer** - 自动导入类型
- **Error Lens** - 实时错误显示

### 调试技巧

```typescript
// 1. Zustand DevTools
import { devtools } from 'zustand/middleware';

const useStore = create(devtools((set) => ({
  // ...
}), { name: 'MyStore' }));

// 2. React DevTools
// 安装浏览器插件查看组件树

// 3. 网络请求日志
api.interceptors.request.use((config) => {
  console.log('[API Request]', config.method, config.url);
  return config;
});
```

---

## 📝 新增功能清单

### 待实现的前端功能

- [ ] 登录/注册页面
- [ ] 路由保护（需要登录）
- [ ] 用户信息展示（右上角头像菜单）
- [ ] 修改密码弹窗
- [ ] 用户设置页面
- [ ] 备忘录按用户隔离
- [ ] 标签按用户隔离
