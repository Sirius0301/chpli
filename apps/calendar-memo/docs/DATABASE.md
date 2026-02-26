# Calendar Memo 数据库设计

本应用使用 **PostgreSQL** 数据库，通过 **Prisma ORM** 进行管理。

## 🐳 本地开发

使用 Docker Compose 运行 PostgreSQL：

```bash
# 启动 PostgreSQL
docker-compose up -d postgres

# 查看日志
docker-compose logs -f postgres
```

## 🗄️ 数据库表

### 1. User（用户表）

```prisma
model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  phone         String?   @unique
  password      String
  name          String
  avatar        String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memos         Memo[]
  tags          Tag[]
  verificationCodes VerificationCode[]
}
```

### 2. VerificationCode（验证码表）

```prisma
model VerificationCode {
  id        String   @id @default(uuid())
  email     String?
  phone     String?
  code      String   @db.VarChar(6)
  type      CodeType
  expiresAt DateTime
  isUsed    Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
}
```

### 3. Memo（备忘录表）

```prisma
model Memo {
  id            String       @id @default(uuid())
  title         String
  description   String?
  location      String?
  date          String
  completed     Boolean      @default(false)
  repeatType    RepeatType   @default(NONE)
  repeatEndType RepeatEndType @default(NEVER)
  repeatEndDate String?
  priority      Priority?
  imageUrl      String?
  
  userId        String
  user          User         @relation(fields: [userId], references: [id])
  
  tags          Tag[]
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

### 4. Tag（标签表）- 用户私有化

```prisma
model Tag {
  id        String   @id @default(uuid())
  name      String
  color     String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  memos     Memo[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, name])
}
```

## 🛠️ Prisma 命令

```bash
cd apps/calendar-memo/server

# 生成 Prisma Client
pnpm db:generate

# 推送结构到数据库（开发）
pnpm db:push

# 创建迁移（生产）
pnpm db:migrate

# 打开图形化界面
pnpm db:studio

# 生成测试数据
pnpm db:seed
```

## 🔗 关系图

```
User 1--* Memo
User 1--* Tag
User 1--* VerificationCode
Memo *--* Tag
```
