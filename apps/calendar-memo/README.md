# Calendar Memo

个人日历备忘录系统，支持重复提醒、标签分类、优先级管理等功能。

## 🚀 快速开始

### 开发模式

```bash
# 安装依赖
pnpm install

# 启动开发服务器（前端 + 后端）
pnpm dev

# 单独启动前端
pnpm dev:web

# 单独启动后端
pnpm dev:server
```

### 生产构建

```bash
# 构建前端
pnpm --filter @chpli/calendar-memo-web build

# 构建后端
pnpm --filter @chpli/calendar-memo-server build

# 启动生产服务器
pnpm start
```

## 📁 目录结构

```
calendar-memo/
├── apps/
│   ├── web/           # React 前端
│   └── server/        # Express 后端
└── shared/            # 共享类型
    └── types/
```

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS + Zustand
- **后端**: Express + TypeScript + better-sqlite3
- **特色功能**: 
  - 农历日期显示
  - 多种重复规则（周、双周、月、季度、半年、年）
  - 标签筛选（AND 逻辑）
  - 优先级管理
  - 图片上传

## 📝 API 文档

见根目录 `API.md`

## 🗄️ 数据库设计

见根目录 `DATABASE.md`
