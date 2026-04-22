# Calendar Memo 系统学习教程

适合人群：能看懂基础代码，想要系统学习全栈开发的初学者

## 学习路线图

```
第一阶段：理解整体架构（1-2天）
    ↓
第二阶段：数据库设计（2-3天）
    ↓
第三阶段：后端API开发（3-5天）
    ↓
第四阶段：前端界面开发（3-5天）
    ↓
第五阶段：整合与部署（2-3天）
```

---

## 第一阶段：理解整体架构

### 1.1 先运行起来

**目标**：让应用在你的电脑上跑起来

```bash
# 1. 安装依赖
pnpm install

# 2. 启动数据库
docker-compose up -d postgres

# 3. 启动后端
cd apps/calendar-memo/server
npx prisma db push
pnpm dev

# 4. 启动前端（新开终端）
cd apps/calendar-memo/web
pnpm dev
```

**思考题**：
- 打开浏览器访问 http://localhost:5173，你能看到什么？
- 打开 http://localhost:3001，返回了什么？
- 这两个地址有什么区别？

### 1.2 了解技术栈

**前端技术栈**（用户看到的东西）：
| 技术 | 作用 | 类比 |
|-----|------|------|
| React | 构建用户界面 | 乐高积木 |
| TypeScript | 给JavaScript加类型检查 | 给变量贴上标签 |
| Vite | 构建工具，编译代码 | 工厂的生产线 |
| TailwindCSS | 快速写样式 | 装修模板 |
| Zustand | 状态管理 | 中央储物柜 |

**后端技术栈**（处理数据的）：
| 技术 | 作用 | 类比 |
|-----|------|------|
| Express | Web服务器框架 | 餐厅服务员 |
| Prisma | 数据库ORM | 翻译官（把代码翻译成SQL） |
| PostgreSQL | 数据库 | 档案室 |
| JWT | 用户认证 | 会员卡 |

### 1.3 项目结构图

```
用户操作 → 前端(React) → 后端(Express) → 数据库(PostgreSQL)
                ↑___________________________↓
                        返回数据
```

**练习**：
1. 在前端创建一个备忘录，观察：
   - 浏览器开发者工具 Network 标签页，看到了什么请求？
   - 后端控制台打印了什么？
2. 画出数据流动的路径

---

## 第二阶段：数据库设计

### 2.1 理解数据模型

打开 `apps/calendar-memo/server/prisma/schema.prisma`

**核心问题**：我们的应用需要存储什么数据？

```prisma
// 用户表 - 谁在用这个系统
model User {
  id       String  @id @default(uuid())
  email    String? @unique
  password String
  name     String
  memos    Memo[]  // 一个用户有多个备忘录
  tags     Tag[]   // 一个用户有多个标签
}

// 备忘录表 - 核心数据
model Memo {
  id       String   @id @default(uuid())
  title    String   // 标题
  date     String   // 日期 2024-03-15
  userId   String   // 属于哪个用户
  user     User     @relation(fields: [userId], references: [id])
  tags     Tag[]    // 多对多关系：一个备忘录可以有多个标签
}

// 标签表 - 分类用
model Tag {
  id     String @id @default(uuid())
  name   String
  userId String
  user   User   @relation(fields: [userId], references: [id])
  memos  Memo[] // 多对多关系：一个标签可以属于多个备忘录
}
```

**关键概念**：
- **关系(Relation)**: 表与表之间的连接
  - 一对一：一个用户对应一个配置文件
  - 一对多：一个用户有多个备忘录
  - 多对多：备忘录和标签（需要中间表）

### 2.2 动手练习

**任务1：观察生成的SQL**

```bash
cd apps/calendar-memo/server
npx prisma migrate dev --name init
```

查看 `prisma/migrations/` 目录下生成的 SQL 文件，理解：
- `CREATE TABLE` 语句
- `FOREIGN KEY` 外键约束
- `_MemoToTag` 中间表（多对多关系自动生成的）

**任务2：数据库操作**

```bash
# 进入数据库
docker exec -it chpli-postgres psql -U chpli -d chpli

# 查看表结构
\dt
\d memos
\d _MemoToTag

# 插入测试数据
INSERT INTO users (id, email, password, name) 
VALUES ('test-uuid', 'test@test.com', 'hashed-password', '测试用户');

INSERT INTO memos (id, title, date, user_id)
VALUES ('memo-uuid', '测试备忘录', '2024-03-15', 'test-uuid');

# 查询数据
SELECT * FROM users;
SELECT * FROM memos;
SELECT m.title, u.name 
FROM memos m 
JOIN users u ON m.user_id = u.id;

\q 退出
```

**任务3：画图理解关系**

画出以下关系图：
1. 创建一个用户
2. 创建两个标签："工作"、"生活"
3. 创建三个备忘录，分别绑定不同标签
4. 观察 `_MemoToTag` 表中的数据

---

## 第三阶段：后端API开发

### 3.1 理解Express基础

**什么是Express？**

就像餐厅的服务员：
- 客人点餐（HTTP请求）
- 服务员记录（路由处理）
- 厨房做菜（业务逻辑）
- 服务员上菜（返回响应）

**最小Express应用**：

```javascript
// apps/calendar-memo/server/src/index.ts 简化版
import express from 'express';

const app = express();
const PORT = 3001;

// 中间件：解析JSON请求体
app.use(express.json());

// 路由：GET请求
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**练习**：
1. 在 `index.ts` 中添加一个新路由 `/time`，返回当前时间
2. 用浏览器或 curl 测试：`curl http://localhost:3001/time`

### 3.2 理解路由和控制器

打开 `apps/calendar-memo/server/src/routes/memoes.ts`

**路由结构**：
```typescript
// 获取所有备忘录
router.get('/', async (req, res) => {
  // 1. 获取当前用户ID（从JWT token）
  const userId = req.userId;
  
  // 2. 查询数据库
  const memos = await prisma.memo.findMany({
    where: { userId },
    include: { tags: true }
  });
  
  // 3. 返回数据
  res.json({ success: true, data: memos });
});

// 创建备忘录
router.post('/', async (req, res) => {
  // 1. 获取请求体数据
  const { title, date, tagIds } = req.body;
  
  // 2. 数据验证
  if (!title) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  
  // 3. 创建记录
  const memo = await prisma.memo.create({
    data: { title, date, userId: req.userId }
  });
  
  // 4. 返回结果
  res.status(201).json({ success: true, data: memo });
});
```

**学习路径**：
1. 先理解 `router.get` 处理查询
2. 再理解 `router.post` 处理创建
3. 然后看 `router.put` 处理更新
4. 最后看 `router.delete` 处理删除

### 3.3 Prisma ORM 入门

**什么是ORM？**

Object-Relational Mapping（对象关系映射）

不用写SQL，用代码操作数据库：

```typescript
// 传统SQL写法
const result = await db.query('SELECT * FROM memos WHERE user_id = $1', [userId]);

// Prisma写法
const memos = await prisma.memo.findMany({
  where: { userId },
  include: { tags: true }
});
```

**常用操作**：

```typescript
// 创建
const memo = await prisma.memo.create({
  data: { title: '新备忘录', date: '2024-03-15', userId: 'xxx' }
});

// 查询列表
const memos = await prisma.memo.findMany({
  where: { userId: 'xxx', completed: false },
  orderBy: { createdAt: 'desc' }
});

// 查询单个
const memo = await prisma.memo.findUnique({
  where: { id: 'memo-id' }
});

// 更新
await prisma.memo.update({
  where: { id: 'memo-id' },
  data: { title: '新标题', completed: true }
});

// 删除
await prisma.memo.delete({
  where: { id: 'memo-id' }
});
```

**练习任务**：

1. 在 `memoes.ts` 中添加注释，说明每行代码的作用
2. 实现一个查询某个日期范围内备忘录的接口
3. 使用 Prisma Studio 查看数据：`npx prisma studio`

### 3.4 认证与授权

**JWT认证流程**：

```
用户登录 → 服务器生成JWT → 客户端存储JWT
                           ↓
后续请求 ← 服务器验证JWT ← 客户端发送JWT（Header）
```

**关键代码理解**：

```typescript
// auth.ts 登录逻辑
const login = async (req, res) => {
  // 1. 验证邮箱密码
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user.password);
  
  if (!valid) {
    return res.status(401).json({ error: '密码错误' });
  }
  
  // 2. 生成JWT（有效期7天）
  const token = jwt.sign(
    { userId: user.id }, 
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // 3. 返回token
  res.json({ token, user });
};

// 验证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next(); // 继续执行后续逻辑
  } catch {
    res.status(401).json({ error: '未登录' });
  }
};
```

**练习**：
1. 在 Postman 或 curl 中测试登录接口
2. 观察 JWT token 的结构（三部分，用点号分隔）
3. 尝试不带 token 访问受保护的路由，观察错误

---

## 第四阶段：前端界面开发

### 4.1 React 基础概念

**组件思维**：

就像搭积木，整个页面由小组件组成：

```
App（整个应用）
  ├── Layout（布局）
  │     ├── Sidebar（侧边栏）
  │     ├── Header（头部）
  │     │     └── 视图切换按钮
  │     └── Main（主内容）
  │           ├── MonthView（月视图）
  │           │     └── DayCell（日期格子）
  │           │           └── MemoItem（备忘录项）
  │           └── DetailPanel（详情面板）
```

**函数组件示例**：

```tsx
// 最简单的组件
function Hello() {
  return <h1>Hello World</h1>;
}

// 带属性的组件
interface Props {
  name: string;
  color: string;
}

function Tag({ name, color }: Props) {
  return (
    <span style={{ backgroundColor: color }}>
      {name}
    </span>
  );
}

// 使用
<Tag name="工作" color="#FF5733" />
```

### 4.2 理解Hooks

**useState - 状态管理**：

```tsx
import { useState } from 'react';

function Counter() {
  // count 是当前值，setCount 是修改函数
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}
```

**useEffect - 副作用**：

```tsx
import { useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  
  // 组件挂载时执行
  useEffect(() => {
    // 获取数据
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []); // 空数组表示只在挂载时执行
  
  return <ul>{users.map(u => <li>{u.name}</li>)}</ul>;
}
```

**练习**：
1. 在 `App.tsx` 中添加一个计数器组件
2. 在 `useEffect` 中打印当前时间，每秒更新一次

### 4.3 理解状态管理（Zustand）

**为什么需要状态管理？**

当多个组件需要共享数据时，避免"prop drilling"（层层传递属性）

**Zustand 基础**：

```typescript
// stores/memoStore.ts 简化版
import { create } from 'zustand';

interface MemoState {
  // 状态
  memos: Memo[];
  selectedDate: Date;
  
  // 操作
  fetchMemos: () => Promise<void>;
  setSelectedDate: (date: Date) => void;
}

export const useMemoStore = create<MemoState>((set, get) => ({
  // 初始状态
  memos: [],
  selectedDate: new Date(),
  
  // 获取备忘录
  fetchMemos: async () => {
    const response = await fetch('/api/memos');
    const data = await response.json();
    set({ memos: data.data }); // 更新状态
  },
  
  // 设置选中日期
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  }
}));

// 在组件中使用
function Calendar() {
  const { memos, selectedDate, fetchMemos } = useMemoStore();
  
  useEffect(() => {
    fetchMemos();
  }, []);
  
  return (
    <div>
      <p>选中日期: {selectedDate.toString()}</p>
      {memos.map(memo => <div>{memo.title}</div>)}
    </div>
  );
}
```

**学习路径**：
1. 理解 `set` 和 `get` 的作用
2. 观察 `useMemoStore()` 如何在多个组件间共享状态
3. 理解为什么修改状态会自动刷新界面

### 4.4 前端架构分析

**数据流**：

```
用户点击"创建备忘录"
    ↓
DetailPanel 组件调用 createMemo
    ↓
memoStore 中的 createMemo 调用 API
    ↓
后端处理，存入数据库
    ↓
成功后，重新 fetchMemos
    ↓
Zustand 更新状态
    ↓
React 自动刷新所有使用 memos 的组件
```

**练习任务**：

1. **添加日志**：在 `memoStore.ts` 的每个 action 中添加 `console.log`，观察数据流
2. **修改样式**：修改 `MemoItem.tsx` 的背景色，观察效果
3. **添加字段**：尝试在前端添加一个"地点"字段的输入框

### 4.5 理解路由（React Router）

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

// 页面跳转
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    // 登录成功后跳转到首页
    navigate('/');
  };
}
```

---

## 第五阶段：整合与部署

### 5.1 理解前后端通信

**Axios 封装**：

```typescript
// utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // 所有请求自动加前缀
  timeout: 10000
});

// 请求拦截器：自动添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 使用
const memos = await api.get('/memos');
const newMemo = await api.post('/memos', { title: '...' });
```

### 5.2 Docker 基础

**为什么要用 Docker？**

- 保证开发环境和生产环境一致
- 一键启动所有服务
- 方便团队协作

**理解 Dockerfile**：

```dockerfile
# 多阶段构建：先构建，后运行

# 阶段1：构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# 阶段2：运行
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

**理解 docker-compose**：

```yaml
version: "3.8"
services:
  # 数据库服务
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  # 后端服务
  server:
    build: ./server
    ports:
      - "3001:3001"
    depends_on:
      - postgres  # 等数据库启动后再启动
  
  # 前端服务
  web:
    build: ./web
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  postgres_data:  # 数据持久化
```

### 5.3 部署到服务器

**步骤回顾**：
1. 购买云服务器
2. 配置安全组（开放80端口）
3. 安装 Docker
4. 上传代码
5. 运行 `docker-compose up -d`

---

## 学习建议

### 每日学习计划

**第1周：熟悉代码**
- Day 1-2: 运行项目，理解整体架构
- Day 3-4: 读懂数据库设计
- Day 5-7: 读懂后端API

**第2周：动手修改**
- Day 8-10: 添加简单的后端接口
- Day 11-14: 修改前端组件

**第3周：独立开发**
- Day 15-17: 添加一个新功能（如备忘录搜索）
- Day 18-21: 部署到云服务器

### 调试技巧

1. **前端调试**：
   - 使用浏览器开发者工具（F12）
   - Network 标签页看请求
   - Console 看错误信息
   - React DevTools 看组件树

2. **后端调试**：
   - 使用 `console.log` 打印变量
   - 查看 `logs/server.log`
   - 使用断点调试（VSCode）

3. **数据库调试**：
   - 使用 `npx prisma studio` 可视化查看
   - 直接执行 SQL 查询

### 推荐阅读

1. **React**: 官方文档 https://react.dev/
2. **TypeScript**: 官方手册 https://www.typescriptlang.org/docs/
3. **Prisma**: 官方教程 https://www.prisma.io/docs/
4. **Express**: 官方指南 https://expressjs.com/en/guide/routing.html

### 练习项目建议

1. 给备忘录添加"优先级筛选"功能
2. 添加"备忘录统计"页面（本月创建数量等）
3. 实现"拖拽排序"功能
4. 添加"导出为CSV"功能

---

## 常见问题

**Q: 我修改了代码，但没有效果？**
A: 检查：
1. 是否保存了文件？
2. 是否需要重启服务？
3. 浏览器是否缓存了？（Ctrl+Shift+R 强制刷新）

**Q: 数据库操作报错？**
A: 检查：
1. 数据库是否启动？`docker ps`
2. Prisma Client 是否生成？`npx prisma generate`
3. 数据库URL是否正确？

**Q: 前端调用API报错404？**
A: 检查：
1. 后端服务是否启动？
2. 代理配置是否正确？（vite.config.ts）
3. 路径是否正确？

---

## 总结

学习全栈开发需要循序渐进：
1. 先看懂代码（2周）
2. 再修改代码（2周）
3. 最后独立写代码（持续）

记住：**不要试图一次理解所有代码**，先跑起来，再逐步深入。

祝你学习愉快！有问题随时问。
