# Chpli Monorepo 架构图

> 本文档使用 Mermaid 语法描述 Chpli Monorepo 的系统上下文、容器、组件及交互序列。

---

## 1. 系统上下文图 (System Context)

```mermaid
C4Context
    title Chpli 系统上下文图

    Person(user, "终端用户", "使用 Chpli 个人生产力套件")

    System_Boundary(chpli, "Chpli Monorepo") {
        System(portal, "Portal", "统一入口前端，单点登录与应用导航")
        System(calendar, "Calendar Memo", "日历备忘录：创建、管理、筛选备忘录，支持重复规则与标签")
        System(bookmark, "Bookmark Manager", "书签管理：标签分类、回收站、导入导出")
        System(userManager, "User Manager", "统一用户认证服务：注册、登录、JWT 签发")
    }

    System_Ext(postgres, "PostgreSQL", "共享关系型数据库")
    System_Ext(caddy, "Caddy", "反向代理与静态文件服务")

    Rel(user, caddy, "访问", "HTTPS/80")
    Rel(caddy, portal, "路由", "HTTP")
    Rel(caddy, calendar, "路由/API", "HTTP")
    Rel(caddy, bookmark, "路由", "HTTP")
    Rel(caddy, userManager, "路由/API", "HTTP")

    Rel(calendar, postgres, "读写数据", "SQL/TCP")
    Rel(userManager, postgres, "读写数据", "SQL/TCP")
    Rel(bookmark, postgres, "读写数据", "SQL/TCP")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 2. 容器图 (Container)

```mermaid
C4Container
    title Chpli Monorepo 容器架构图

    Person(user, "终端用户", "使用浏览器访问 Chpli")

    Container_Boundary(caddy_boundary, "网关层") {
        Container(caddy, "Caddy", "Caddy 2", "反向代理、TLS 终止、静态资源托管")
    }

    Container_Boundary(frontend, "前端层 (React + Vite)") {
        Container(portal_web, "Portal Web", "React + Vite + TailwindCSS", "统一入口：登录页、首页导航、iframe 嵌套子应用")
        Container(calendar_web, "Calendar Memo Web", "React + Vite + Zustand", "日历视图、备忘录 CRUD、标签管理、文件上传")
        Container(bookmark_web, "Bookmark Web", "React + Vite + React Query", "书签列表、回收站、导入导出")
    }

    Container_Boundary(backend, "后端层 (Node.js + Express)") {
        Container(user_manager, "User Manager Server", "Express + Prisma", "统一认证：注册 / 登录 / JWT 签发 / 验证码")
        Container(calendar_server, "Calendar Memo Server", "Express + Prisma", "业务 API：备忘录 / 标签 / 上传")
    }

    ContainerDb(postgres, "PostgreSQL", "PostgreSQL 16", "统一数据库，按表前缀隔离")

    Container_Boundary(shared, "共享包") {
        Container(auth_shared, "auth-shared", "TypeScript", "JWT 生成/验证、Express 认证中间件")
        Container(cm_shared, "calendar-memo-shared", "TypeScript", "Memo/Tag 共享类型定义")
    }

    Rel(user, caddy, "访问", "HTTP/HTTPS")
    Rel(caddy, portal_web, "代理", "HTTP")
    Rel(caddy, calendar_web, "代理", "HTTP")
    Rel(caddy, bookmark_web, "代理", "HTTP")
    Rel(caddy, user_manager, "代理 /api/auth", "HTTP")
    Rel(caddy, calendar_server, "代理 /api/memos 等", "HTTP")

    Rel(portal_web, user_manager, "登录/获取用户信息", "XHR /api/auth")
    Rel(portal_web, calendar_web, "iframe 嵌入 + postMessage 传递 Token", "浏览器内")
    Rel(portal_web, bookmark_web, "iframe 嵌入 + postMessage 传递 Token", "浏览器内")
    Rel(calendar_web, calendar_server, "CRUD API", "XHR + Bearer Token")
    Rel(bookmark_web, calendar_server, "书签 API", "XHR + Bearer Token")

    Rel(user_manager, postgres, "读写 um_users / um_verification_codes", "Prisma/TCP")
    Rel(calendar_server, postgres, "读写 cm_memos / cm_tags / cm_memo_completions", "Prisma/TCP")

    Rel(user_manager, auth_shared, "依赖", "Workspace")
    Rel(calendar_server, auth_shared, "依赖", "Workspace")
    Rel(calendar_server, cm_shared, "依赖", "Workspace")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 3. 组件图 (Component)

### 3.1 Calendar Memo Server 组件图

```mermaid
C4Component
    title Calendar Memo Server 组件图

    Container(calendar_web, "Calendar Memo Web", "React", "前端应用")
    Container(user_manager, "User Manager Server", "Express", "统一认证服务")

    Boundary(server, "Calendar Memo Server") {
        Component(index, "Express App", "index.ts", "CORS、JSON 解析、路由挂载、错误处理")
        Component(memos_route, "Memos Router", "routes/memoes.ts", "备忘录 CRUD、完成状态、重复规则计算")
        Component(tags_route, "Tags Router", "routes/tags.ts", "标签 CRUD、标签与备忘录关联")
        Component(upload_route, "Upload Router", "routes/upload.ts", "图片上传、静态文件服务")
        Component(prisma, "Prisma Client", "db/prisma.ts", "数据库连接与 ORM 操作")
        Component(auth_mw, "Auth Middleware", "auth-shared", "Bearer Token 校验、userId 注入")
    }

    ContainerDb(postgres, "PostgreSQL", "PostgreSQL", "cm_memos / cm_tags / cm_memo_completions")

    Rel(calendar_web, index, "HTTP Request", "Bearer JWT")
    Rel(index, memos_route, "/api/memos")
    Rel(index, tags_route, "/api/tags")
    Rel(index, upload_route, "/api/upload")

    Rel(memos_route, auth_mw, "use", "验证身份")
    Rel(tags_route, auth_mw, "use", "验证身份")
    Rel(upload_route, auth_mw, "use", "验证身份")
    Rel(auth_mw, user_manager, "共享 JWT Secret", "离线验证")

    Rel(memos_route, prisma, "读写")
    Rel(tags_route, prisma, "读写")
    Rel(upload_route, prisma, "可选读写")
    Rel(prisma, postgres, "SQL")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### 3.2 User Manager Server 组件图

```mermaid
C4Component
    title User Manager Server 组件图

    Container(portal_web, "Portal Web", "React", "统一入口")
    Container(calendar_server, "Calendar Memo Server", "Express", "业务后端")

    Boundary(server, "User Manager Server") {
        Component(index, "Express App", "index.ts", "CORS、路由挂载、全局错误处理")
        Component(auth_route, "Auth Router", "routes/auth.ts", "注册 / 登录 / 获取当前用户 / 验证码")
        Component(prisma, "Prisma Client", "db/prisma.ts", "ORM 操作")
        Component(auth_shared, "Auth Shared", "packages/auth-shared", "JWT 生成与验证工具")
    }

    ContainerDb(postgres, "PostgreSQL", "PostgreSQL", "um_users / um_verification_codes")

    Rel(portal_web, index, "HTTP Request", "JSON")
    Rel(index, auth_route, "/api/auth")
    Rel(auth_route, prisma, "读写")
    Rel(prisma, postgres, "SQL")
    Rel(auth_route, auth_shared, "生成 Token", "JWT")
    Rel(calendar_server, auth_shared, "验证 Token", "共享密钥")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### 3.3 Portal Web 组件图

```mermaid
C4Component
    title Portal Web 组件图

    Container(user_manager, "User Manager Server", "Express", "统一认证")
    Container(calendar_web, "Calendar Memo Web", "React", "日历备忘录前端")
    Container(bookmark_web, "Bookmark Web", "React", "书签管理前端")

    Boundary(portal, "Portal Web") {
        Component(app, "App Router", "App.tsx", "路由定义：/ /home /calendar /bookmark")
        Component(auth_ctx, "AuthContext", "contexts/AuthContext.tsx", "登录状态、Token 管理、axios 全局授权头")
        Component(login_page, "Login Page", "pages/Login.tsx", "用户登录界面")
        Component(home_page, "Home Page", "pages/Home.tsx", "应用选择卡片")
        Component(calendar_frame, "CalendarFrame", "pages/CalendarFrame.tsx", "iframe 嵌入 Calendar Memo，postMessage 传递 Token")
        Component(bookmark_frame, "BookmarkFrame", "pages/BookmarkFrame.tsx", "iframe 嵌入 Bookmark Manager，postMessage 传递 Token")
    }

    Rel(login_page, auth_ctx, "调用 login")
    Rel(auth_ctx, user_manager, "POST /api/auth/login, GET /api/auth/me")
    Rel(home_page, app, "导航 /calendar /bookmark")
    Rel(calendar_frame, calendar_web, "iframe src + postMessage {AUTH_TOKEN}")
    Rel(bookmark_frame, bookmark_web, "iframe src + postMessage {AUTH_TOKEN}")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 4. 交互序列图

### 4.1 用户登录与访问 Portal 首页

```mermaid
sequenceDiagram
    autonumber
    actor U as 用户
    participant B as 浏览器
    participant P as Portal Web
    participant UM as User Manager Server
    participant PG as PostgreSQL

    U->>B: 打开 http://localhost
    B->>P: GET /
    P-->>B: 返回 Login 页面
    U->>B: 输入邮箱/密码，点击登录
    B->>P: 触发 login(email, password)
    P->>UM: POST /api/auth/login {email, password}
    UM->>UM: bcryptjs 校验密码
    UM->>PG: 查询用户
    PG-->>UM: 返回用户数据
    UM->>UM: auth-shared.generateToken(userId)
    UM-->>P: 200 {user, token}
    P->>P: localStorage.setItem('token', token)<br/>axios.defaults.headers.common['Authorization']
    P->>P: setUser(user)
    P-->>B: 渲染 Home 页面（应用选择）
    U->>B: 看到 Calendar Memo / Bookmark Manager 入口
```

### 4.2 通过 Portal 访问 Calendar Memo（iframe + API 全流程）

```mermaid
sequenceDiagram
    autonumber
    actor U as 用户
    participant B as 浏览器
    participant P as Portal Web
    participant CW as Calendar Memo Web
    participant CS as Calendar Memo Server
    participant PG as PostgreSQL

    U->>B: 在 Portal 首页点击 Calendar Memo
    B->>P: 路由跳转 /calendar
    P->>B: 渲染 CalendarFrame 组件
    B->>CW: iframe 加载 http://localhost:5175
    CW-->>B: 返回 Calendar Memo 前端
    P->>B: postMessage {type: 'AUTH_TOKEN', token}
    B->>CW: iframe.contentWindow.postMessage
    CW->>CW: AuthContext 接收 token 并设置 axios 头

    U->>B: 查看某月备忘录
    B->>CW: 触发数据加载
    CW->>CS: GET /api/memos (Bearer Token)
    CS->>CS: authMiddleware 验证 JWT
    CS->>PG: Prisma 查询 cm_memos / cm_memo_completions
    PG-->>CS: 返回备忘录列表
    CS-->>CW: 200 {memos}
    CW-->>B: 渲染日历视图

    U->>B: 新建备忘录
    B->>CW: 填写表单并提交
    CW->>CS: POST /api/memos (Bearer Token)
    CS->>CS: authMiddleware 验证 JWT
    CS->>PG: Prisma 创建 cm_memos
    PG-->>CS: 返回新记录
    CS-->>CW: 201 {memo}
    CW-->>B: 更新列表并提示成功
```

### 4.3 通过 Portal 访问 Bookmark Manager（iframe 模式）

```mermaid
sequenceDiagram
    autonumber
    actor U as 用户
    participant B as 浏览器
    participant P as Portal Web
    participant BW as Bookmark Web
    participant API as Bookmark API / 后端
    participant PG as PostgreSQL

    U->>B: 在 Portal 首页点击 Bookmark Manager
    B->>P: 路由跳转 /bookmark
    P->>B: 渲染 BookmarkFrame 组件
    B->>BW: iframe 加载 http://localhost:5174
    BW-->>B: 返回 Bookmark Manager 前端
    P->>B: postMessage {type: 'AUTH_TOKEN', token}
    B->>BW: iframe.contentWindow.postMessage
    BW->>BW: localStorage.setItem('token', token)<br/>axios interceptors 自动附加 Bearer

    U->>B: 查看书签列表
    B->>BW: 触发 useBookmarks hook
    BW->>API: GET /api/v1/bookmarks (Bearer Token)
    API->>PG: 查询 bookmarks 表
    PG-->>API: 返回数据
    API-->>BW: 200 {bookmarks}
    BW-->>B: 渲染书签卡片列表

    U->>B: 删除书签到回收站
    B->>BW: 点击删除
    BW->>API: PATCH /api/v1/bookmarks/:id {deleted: true}
    API->>PG: 更新记录
    PG-->>API: 确认
    API-->>BW: 200
    BW->>BW: React Query invalidateQueries
    BW-->>B: 刷新列表
```

### 4.4 Workspace 共享包依赖关系

```mermaid
sequenceDiagram
    autonumber
    participant UM as User Manager Server
    participant CS as Calendar Memo Server
    participant AS as packages/auth-shared
    participant CMS as calendar-memo/shared

    Note over UM,AS: 启动阶段
    UM->>AS: import { generateToken, JWT_SECRET }
    CS->>AS: import { authMiddleware, verifyToken }
    CS->>CMS: import { Memo, Tag, RepeatType } (类型)

    Note over UM,CS: 登录请求
    UM->>UM: 校验用户名密码
    UM->>AS: generateToken(userId)
    AS-->>UM: JWT Token
    UM-->>客户端: {token, user}

    Note over CS,AS: API 请求
    CS->>AS: authMiddleware(req, res, next)
    AS->>AS: verifyToken(bearerToken)
    AS->>CS: req.userId = decoded.userId
    CS->>CS: 继续业务处理
```

---

## 5. 部署拓扑图 (Deployment)

```mermaid
graph TB
    subgraph 宿主机 / 云服务器
        Caddy["🌐 Caddy<br/>端口 80/443"]

        subgraph Docker Network: chpli-network
            Portal["🖥️ Portal Web<br/>Nginx / Vite Preview<br/>暴露 80"]
            CalendarWeb["📅 Calendar Memo Web<br/>Nginx / Vite Preview<br/>暴露 80"]
            BookmarkWeb["🔖 Bookmark Web<br/>Nginx / Vite Preview<br/>暴露 80"]
            CalendarServer["🗄️ Calendar Memo Server<br/>Node.js + Express<br/>端口 3001"]
            UserManager["🔐 User Manager Server<br/>Node.js + Express<br/>端口 3002"]
            Postgres[(🐘 PostgreSQL 16<br/>端口 5432)]
        end
    end

    User["👤 终端用户"] -->|HTTP| Caddy
    Caddy -->|/| Portal
    Caddy -->|/api/memos| CalendarServer
    Caddy -->|/api/tags| CalendarServer
    Caddy -->|/api/upload| CalendarServer
    Caddy -->|/api/auth| UserManager
    Caddy -->|/calendar| CalendarWeb
    Caddy -->|/bookmark| BookmarkWeb

    Portal -.->|iframe + postMessage| CalendarWeb
    Portal -.->|iframe + postMessage| BookmarkWeb

    CalendarServer -->|Prisma| Postgres
    UserManager -->|Prisma| Postgres

    CalendarServer -.->|workspace 依赖| AuthShared["📦 @chpli/auth-shared"]
    UserManager -.->|workspace 依赖| AuthShared
    CalendarServer -.->|workspace 依赖| CMShared["📦 @chpli/calendar-memo-shared"]
```

---

## 附录：技术栈速查

| 层级 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript + Vite |
| **前端状态** | Zustand (Calendar), React Query (Bookmark) |
| **UI 样式** | TailwindCSS + Lucide React |
| **后端框架** | Express 4 + TypeScript |
| **ORM / 数据库** | Prisma 5 + PostgreSQL 16 |
| **认证** | JWT (jsonwebtoken) + bcryptjs |
| **反向代理** | Caddy 2 |
| **包管理 / Monorepo** | pnpm 10 + Workspaces |
| **容器化** | Docker + Docker Compose |
