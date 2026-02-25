# 项目目录结构

```
calendar-memo/                    # 项目根目录
├── README.md                     # 项目入口文档
├── TECH_DESIGN.md               # 技术架构文档
├── API.md                       # API 接口文档
├── DATABASE.md                  # 数据库设计文档
├── PROJECT_STRUCTURE.md         # 本文件
├── package.json                 # Monorepo 根配置 (workspaces)
├── pnpm-workspace.yaml          # pnpm workspace 配置
├── .gitignore                   # 全局 gitignore
│
├── apps/                        # 应用目录
│   ├── web/                     # 前端 React 应用
│   │   ├── package.json         # 前端依赖
│   │   ├── vite.config.ts       # Vite 配置
│   │   ├── tsconfig.json        # TypeScript 配置
│   │   ├── tailwind.config.js   # Tailwind CSS 配置
│   │   ├── index.html           # HTML 入口
│   │   └── src/
│   │       ├── main.tsx         # 应用入口
│   │       ├── App.tsx          # 根组件
│   │       ├── types/           # 类型定义
│   │       │   └── index.ts     # Memo, Tag 等接口
│   │       ├── components/      # React 组件
│   │       │   ├── Layout.tsx   # 整体布局
│   │       │   ├── Sidebar.tsx  # 左侧边栏（筛选）
│   │       │   ├── Header.tsx   # 顶部导航（周/月切换）
│   │       │   ├── WeekView.tsx # 周视图网格
│   │       │   ├── MonthView.tsx# 月视图网格
│   │       │   ├── DayCell.tsx  # 日期单元格
│   │       │   ├── MemoItem.tsx # 备忘录条目（复选框+标题）
│   │       │   └── DetailPanel.tsx # 右侧详情/编辑面板
│   │       ├── stores/          # Zustand 状态管理
│   │       │   └── memoStore.ts # 全局状态
│   │       └── utils/           # 工具函数
│   │           ├── calendar.ts  # 日期计算（农历、重复规则）
│   │           └── api.ts       # API 客户端
│   │
│   └── server/                  # 后端 Express 应用
│       ├── package.json         # 后端依赖
│       ├── tsconfig.json        # TypeScript 配置
│       ├── database.sqlite      # SQLite 数据库文件 (gitignored)
│       ├── uploads/             # 图片上传目录 (gitignored)
│       │   └── .gitkeep
│       └── src/
│           ├── index.ts         # 服务器入口
│           ├── db/
│           │   ├── index.ts     # 数据库连接与语句
│           │   ├── schema.sql   # 建表 SQL
│           │   └── seed.ts      # 示例数据（可选）
│           ├── routes/
│           │   ├── memos.ts     # /api/memos 路由
│           │   ├── tags.ts      # /api/tags 路由
│           │   └── upload.ts    # /api/upload 路由
│           └── utils/
│               └── fileStorage.ts # 文件处理工具
│
└── shared/                      # 共享代码（前后端通用类型）
    └── types/
        └── index.ts             # DTO 接口定义
```

## 关键文件说明

### 根目录配置
- **package.json**: 定义 workspaces，统一脚本（dev/build/test）
- **pnpm-workspace.yaml**: pnpm 工作区配置，识别 apps/* 和 shared/*

### 前端 (apps/web)
- **vite.config.ts**: 配置代理到后端 localhost:3001，解决跨域
- **tailwind.config.js**: 自定义颜色、字体，仿苹果日历风格
- **stores/memoStore.ts**: 单一数据源，管理所有备忘录状态和筛选逻辑
- **utils/calendar.ts**: 核心算法，处理重复规则展开和农历计算

### 后端 (apps/server)
- **db/index.ts**: better-sqlite3 实例和预处理语句集中管理
- **db/schema.sql**: 数据库结构定义，首次启动自动执行
- **routes/*.ts**: 按资源分模块的路由定义

## 开发工作流

### 新增功能流程
1. **数据库变更**: 修改 `apps/server/src/db/schema.sql`，编写迁移逻辑
2. **API 更新**: 在 `apps/server/src/routes/` 新增端点，更新 `API.md`
3. **类型同步**: 在 `shared/types/index.ts` 更新接口
4. **前端实现**: 
   - 更新 `apps/web/src/types/index.ts` (引用 shared)
   - 在 `stores/` 新增 state 和 action
   - 在 `components/` 新建 UI 组件
   - 在 `utils/calendar.ts` 补充工具函数

### 调试技巧
- **数据库**: 使用 VS Code SQLite 插件直接查看 `database.sqlite`
- **API 测试**: 使用 Postman 或 Thunder Client，导入 `API.md` 中的端点
- **前端状态**: 安装 Zustand DevTools（通过 Chrome 插件）

## 构建与部署

### 开发模式
```bash
pnpm dev          # 同时启动前端(5173)和后端(3001)
pnpm dev:web      # 仅前端
pnpm dev:server   # 仅后端
```

### 生产构建
```bash
pnpm build        # 构建前端到 apps/web/dist
pnpm start        # 以生产模式启动后端（提供静态文件）
```

生产部署时，后端 Express 同时作为 API 服务器和静态文件服务器，访问 `http://localhost:3001` 即可看到完整应用。
