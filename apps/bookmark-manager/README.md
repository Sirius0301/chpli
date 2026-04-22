# Bookmark Manager

个人书签管理应用，支持标签分类、回收站、点击统计和导入导出。

## 结构

```
bookmark-manager/
├── server/          # FastAPI + SQLAlchemy (async) + Alembic
│   ├── app/         # 路由、模型、CRUD
│   ├── alembic/     # 数据库迁移
│   ├── .venv/       # Python 虚拟环境
│   └── requirements.txt
└── web/             # React + Vite + React Query + Zustand
    └── src/
```

## 本地开发

### 后端

```bash
cd server

# 1. 创建虚拟环境
python -m venv .venv
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env

# 4. 运行迁移
alembic upgrade head

# 5. 启动服务
uvicorn app.main:app --reload --port 8001
```

**Alembic 常用命令：**
```bash
alembic revision --autogenerate -m "描述"
alembic upgrade head
alembic downgrade -1
```

### 前端

```bash
cd web
pnpm install
pnpm dev
```

访问 http://localhost:5174

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET/POST | `/api/v1/bookmarks` | 书签列表 / 创建 |
| PATCH | `/api/v1/bookmarks/{id}` | 更新书签 |
| DELETE | `/api/v1/bookmarks/{id}` | 删除书签到回收站 |
| GET/POST | `/api/v1/tags` | 标签列表 / 创建 |

## 技术栈

- **后端**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, asyncpg
- **前端**: React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand
