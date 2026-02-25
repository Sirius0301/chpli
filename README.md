# 📅 Calendar Memo System

个人日历备忘录系统，支持周/月视图、重复规则、标签优先级管理，帮助构建人生 OKR 管理体系。

## 技术栈
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + date-fns + lunar-javascript
- **后端**: Node.js + Express + TypeScript + better-sqlite3
- **存储**: SQLite (本地文件) + 本地文件系统 (图片)

## 快速开始

### 环境要求
- Node.js ≥ 18
- pnpm (推荐) 或 npm

### 安装依赖
```bash
pnpm install
```

### 开发模式（同时启动前后端）
```bash
pnpm dev
```
- 前端: http://localhost:5173
- 后端: http://localhost:3001

### 生产构建
```bash
pnpm build
pnpm start
```

## 文档索引
- [TECH_DESIGN.md](./TECH_DESIGN.md) - 技术架构详细设计
- [API.md](./API.md) - REST API 接口文档  
- [DATABASE.md](./DATABASE.md) - 数据库 Schema 设计
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 项目目录结构说明

## 核心功能
- [x] 周/月视图切换，支持农历和节气显示
- [x] 备忘录 CRUD，支持图片上传
- [x] 重复规则（Weekly/Biweekly/Monthly/3m/6m/Yearly）
- [x] 标签与优先级筛选（并集 OR 逻辑）
- [x] 完成状态跟踪
- [ ] 数据导入导出 (Phase 2)

## 数据存储
- 数据库: `apps/server/database.sqlite`
- 上传图片: `apps/server/uploads/`

**注意**: 这两个目录已加入 .gitignore，请自行备份重要数据。
