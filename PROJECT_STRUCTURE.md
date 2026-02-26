# Chpli 项目结构

## 目录概览

```
chpli/                               # Monorepo 根目录
├── README.md                        # 项目入口文档
├── TECH_DESIGN.md                  # 技术架构文档
├── API.md                          # API 接口文档
├── DATABASE.md                     # 数据库设计文档
├── PROJECT_STRUCTURE.md            # 本文件
├── docker-compose.yml              # Docker Compose 配置
├── .env.example                    # 环境变量示例
├── package.json                    # Monorepo 根配置
├── pnpm-workspace.yaml             # pnpm workspace 配置
│
├── apps/                           # 应用目录
│   └── calendar-memo/              # 日历备忘录应用
│       ├── README.md               # 应用文档
│       ├── package.json            # 应用级 package.json
│       ├── apps/                   # 子应用
│       │   ├── web/                # 前端 React 应用
│       │   │   ├── Dockerfile      # 前端 Dockerfile
│       │   │   ├── nginx.conf      # Nginx 配置
│       │   │   ├── vite.config.ts  # Vite 配置
│       │   │   ├── package.json    # 前端依赖 (@chpli/calendar-memo-web)
│       │   │   └── src/
│       │   │       ├── main.tsx    # 应用入口
│       │   │       ├── App.tsx     # 根组件
│       │   │       ├── types/      # 类型定义
│       │   │       ├── components/ # React 组件
│       │   │       ├── stores/     # Zustand 状态管理
│       │   │       └── utils/      # 工具函数
│       │   │
│       │   └── server/             # 后端 Express 应用
│       │       ├── Dockerfile      # 后端 Dockerfile
│       │       ├── package.json    # 后端依赖 (@chpli/calendar-memo-server)
│       │       ├── tsconfig.json   # TypeScript 配置
│       │       └── src/
│       │           ├── index.ts    # 服务器入口
│       │           ├── db/         # 数据库
│       │           ├── routes/     # API 路由
│       │           └── utils/      # 工具函数
│       │
│       └── shared/                 # 共享代码
│           └── types/              # 前后端通用类型
│               ├── package.json    # @chpli/calendar-memo-shared
│               └── types/
│                   └── index.ts    # DTO 接口定义
│
├── packages/                       # 共享包目录（未来扩展）
│
└── infra/                          # 基础设施配置
    └── postgres/                   # PostgreSQL 配置
        └── init/
            └── 01-init.sql         # 初始化脚本
```

## 关键文件说明

### 根目录配置

- **package.json**: Monorepo 根配置，定义 workspace 和统一脚本
- **pnpm-workspace.yaml**: pnpm 工作区配置，识别 `apps/*` 和 `packages/*`
- **docker-compose.yml**: 编排 PostgreSQL、前端、后端服务

### Calendar Memo 应用

- **apps/web**: React + Vite + TailwindCSS 前端
  - 包名: `@chpli/calendar-memo-web`
  - 端口: 5173
  
- **apps/server**: Express + TypeScript 后端
  - 包名: `@chpli/calendar-memo-server`
  - 端口: 3001
  
- **shared/types**: 前后端共享类型
  - 包名: `@chpli/calendar-memo-shared`

## 开发工作流

### 新增应用流程

1. 在 `apps/` 下创建新应用目录
2. 使用命名规范 `@chpli/<app-name>` 作为包名
3. 创建内部的 `apps/`（子应用）和 `shared/`（共享代码）
4. 更新 `pnpm-workspace.yaml`（如需要）
5. 更新根目录 `package.json` 的 scripts
6. 添加 Dockerfile 和必要的配置
7. 更新 `docker-compose.yml`

### 引用共享类型

```typescript
// 前端或后端代码中
import type { Memo, Tag } from '@chpli/calendar-memo-shared';
```

## 构建与部署

### 开发模式

```bash
# 启动所有应用
cd apps/calendar-memo
pnpm dev

# 单独启动
pnpm dev:web
pnpm dev:server
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 仅启动数据库
pnpm db:up
```

### 生产构建

```bash
# 前端
pnpm --filter @chpli/calendar-memo-web build

# 后端
pnpm --filter @chpli/calendar-memo-server build
```
