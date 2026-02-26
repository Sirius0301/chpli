# Calendar Memo 数据库设计

本应用使用 **PostgreSQL** 数据库，通过 **Prisma ORM** 进行管理。

## 📁 模型文件

```
server/prisma/schema.prisma
```

## 🗄️ 数据库表

### 1. User（用户表）

存储用户基本信息和认证凭证。

```prisma
model User {
  id            String    @id @default(uuid())
  email         String?   @unique    // 邮箱，可选但唯一
  phone         String?   @unique    // 手机号，可选但唯一
  password      String               // bcrypt 加密后的密码
  name          String               // 用户昵称
  avatar        String?              // 头像 URL
  isActive      Boolean   @default(true)  // 账号状态
  lastLoginAt   DateTime?            // 最后登录时间
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联
  memos         Memo[]               // 用户的备忘录
  verificationCodes VerificationCode[]  // 验证码记录
}
```

**索引**:
- `email` - 唯一索引，用于登录
- `phone` - 唯一索引，用于登录

---

### 2. VerificationCode（验证码表）

存储发送的验证码，用于注册、找回密码、修改密码。

```prisma
model VerificationCode {
  id        String   @id @default(uuid())
  email     String?              // 目标邮箱
  phone     String?              // 目标手机号
  code      String   @db.VarChar(6)  // 6位数字验证码
  type      CodeType             // 验证码类型（注册/重置/修改）
  expiresAt DateTime             // 过期时间（10分钟）
  isUsed    Boolean  @default(false)  // 是否已使用
  usedAt    DateTime?            // 使用时间
  createdAt DateTime @default(now())
  
  // 关联
  userId    String?              // 修改密码时关联的用户
  user      User?    @relation(fields: [userId], references: [id])
}

enum CodeType {
  REGISTER        // 注册
  RESET_PASSWORD  // 重置密码
  CHANGE_PASSWORD // 修改密码
}
```

**索引**:
- `(email, type, createdAt)` - 用于查询最近验证码
- `(phone, type, createdAt)` - 用于查询最近验证码

**业务规则**:
- 验证码 10 分钟过期
- 每小时最多发送 5 次
- 使用后标记 `isUsed = true`

---

### 3. Memo（备忘录表）

存储用户的备忘录事项。

```prisma
model Memo {
  id            String       @id @default(uuid())
  title         String                        // 标题
  description   String?                       // 备注
  location      String?                       // 地点
  date          String                        // 日期 YYYY-MM-DD
  completed     Boolean      @default(false)  // 完成状态
  repeatType    RepeatType   @default(NONE)   // 重复类型
  repeatEndType RepeatEndType @default(NEVER)  // 重复结束类型
  repeatEndDate String?                       // 重复结束日期
  priority      Priority?                     // 优先级
  imageUrl      String?                       // 图片 URL
  
  // 关联用户
  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // 关联标签
  tags          Tag[]
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum RepeatType {
  NONE         // 不重复
  DAILY        // 每天
  WEEKLY       // 每周
  BIWEEKLY     // 每两周
  MONTHLY      // 每月
  QUARTERLY    // 每季度
  SEMIANNUAL   // 每半年
  YEARLY       // 每年
}

enum RepeatEndType {
  NEVER   // 永不结束
  ONDATE  // 指定日期结束
}

enum Priority {
  HIGH    // 高
  MEDIUM  // 中
  LOW     // 低
}
```

**索引**:
- `(userId, date)` - 按用户和日期查询
- `(userId, completed)` - 按用户和完成状态查询

---

### 4. Tag（标签表）

存储用户自定义标签（用户私有化）。

```prisma
model Tag {
  id        String   @id @default(uuid())
  name      String                        // 标签名
  color     String?                       // 颜色代码
  userId    String                        // 所属用户
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  memos     Memo[]                        // 关联的备忘录
  createdAt DateTime @default(now())

  @@unique([userId, name])  // 每个用户的标签名唯一
}
```

**特点**:
- **用户隔离**: 每个用户只能看到/管理自己的标签
- **同名限制**: 同一用户不能有同名标签，不同用户可以
- **级联策略**: 
  - 用户删除 → 删除其所有标签（`onDelete: Cascade`）
  - 标签删除 → 解除与备忘录的关联，不删除备忘录

---

## 🔗 关系图

```
┌─────────────┐       ┌─────────────────────┐
│    User     │       │   VerificationCode  │
├─────────────┤       ├─────────────────────┤
│ id (PK)     │◄──────┤ id (PK)             │
│ email       │  1:N  │ email/phone         │
│ phone       │       │ code                │
│ password    │       │ type                │
│ name        │       │ expiresAt           │
│ ...         │       └─────────────────────┘
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│    Memo     │◄─────►│     Tag     │
├─────────────┤  N:M  ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ userId (FK) │       │ userId (FK) │
│ title       │       │ name        │
│ date        │       │ color       │
│ completed   │       └─────────────┘
│ ...         │
└─────────────┘
```

---

## 🚀 常用操作

### 初始化数据库

```bash
cd apps/calendar-memo/server

# 生成 Prisma Client
pnpm db:generate

# 创建并应用迁移
pnpm db:migrate --name init

# 或快速同步（开发环境）
pnpm db:push

# 打开 Prisma Studio（图形化管理界面）
pnpm db:studio
```

### 数据库连接

```typescript
// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

### 常用查询示例

```typescript
// 创建用户
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed_password',
    name: '张三',
  },
});

// 查找用户（邮箱或手机）
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { email: 'user@example.com' },
      { phone: '13800138000' },
    ],
  },
});

// 获取用户的所有备忘录
const memos = await prisma.memo.findMany({
  where: { userId: 'user-uuid' },
  include: { tags: true },
  orderBy: { date: 'desc' },
});

// 验证验证码
const code = await prisma.verificationCode.findFirst({
  where: {
    email: 'user@example.com',
    code: '123456',
    type: 'REGISTER',
    isUsed: false,
    expiresAt: { gt: new Date() },
  },
});
```

---

## 📝 迁移历史

| 版本 | 描述 | 日期 |
|------|------|------|
| init | 初始迁移：User, VerificationCode, Memo, Tag | 2024-XX-XX |
