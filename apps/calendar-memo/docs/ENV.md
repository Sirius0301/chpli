# Calendar Memo 环境变量配置

本文档说明所有可用的环境变量及其用途。

## 🚀 快速配置

```bash
cp server/.env.example server/.env
```

然后根据实际情况编辑 `.env` 文件。

---

## 🔧 核心配置

### NODE_ENV

- **说明**: 运行环境
- **类型**: `string`
- **可选值**: `development` | `production` | `test`
- **默认值**: `development`
- **示例**:
  ```bash
  NODE_ENV=development
  ```

### PORT

- **说明**: 服务器监听端口
- **类型**: `number`
- **默认值**: `3001`
- **示例**:
  ```bash
  PORT=3001
  ```

---

## 🗄️ 数据库配置

### DATABASE_URL

- **说明**: PostgreSQL 数据库连接字符串
- **类型**: `string`
- **必填**: ✅ 是
- **格式**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`
- **示例**:
  ```bash
  # 本地开发
  DATABASE_URL="postgresql://chpli:chpli_secret@localhost:5432/chpli?schema=calendar_memo"
  
  # Docker 环境
  DATABASE_URL="postgresql://chpli:chpli_secret@postgres:5432/chpli?schema=calendar_memo"
  
  # 生产环境（使用连接池）
  DATABASE_URL="postgresql://chpli:password@prod-db.example.com:5432/chpli?schema=calendar_memo&connection_limit=20"
  ```

**参数说明**:
- `USER` - 数据库用户名
- `PASSWORD` - 数据库密码
- `HOST` - 数据库主机地址
- `PORT` - 数据库端口（默认 5432）
- `DATABASE` - 数据库名
- `schema` - Schema 名称（使用 `calendar_memo` 隔离）

---

## 🔐 JWT 认证配置

### JWT_SECRET

- **说明**: JWT 签名密钥
- **类型**: `string`
- **必填**: ✅ 是（生产环境必须修改）
- **安全要求**:
  - 至少 32 个字符
  - 包含大小写字母、数字、特殊字符
  - 生产环境必须随机生成
- **生成命令**:
  ```bash
  # Linux/Mac
  openssl rand -base64 32
  
  # 或使用 Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **示例**:
  ```bash
  # 开发环境（不安全，仅测试使用）
  JWT_SECRET=dev-secret-key
  
  # 生产环境（必须修改）
  JWT_SECRET=a1b2c3d4e5f6...（32位以上随机字符串）
  ```

### JWT_EXPIRES_IN

- **说明**: JWT Token 有效期
- **类型**: `string`
- **格式**: 数字 + 单位（`s`秒/`m`分/`h`时/`d`天）
- **默认值**: `7d`
- **示例**:
  ```bash
  JWT_EXPIRES_IN=7d    # 7 天
  JWT_EXPIRES_IN=24h   # 24 小时
  JWT_EXPIRES_IN=30d   # 30 天
  ```

---

## 📱 腾讯云 SES/SMS 配置（生产环境必需）

用于发送验证码短信和邮件。

### TENCENT_SECRET_ID

- **说明**: 腾讯云 API 密钥 ID
- **类型**: `string`
- **获取**: [腾讯云控制台](https://console.cloud.tencent.com/cam/capi)
- **示例**:
  ```bash
  TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxx
  ```

### TENCENT_SECRET_KEY

- **说明**: 腾讯云 API 密钥
- **类型**: `string`
- **获取**: [腾讯云控制台](https://console.cloud.tencent.com/cam/capi)
- **安全**: 切勿泄露，定期轮换
- **示例**:
  ```bash
  TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxx
  ```

### SMS_SIGN_NAME

- **说明**: 短信签名
- **类型**: `string`
- **获取**: [腾讯云短信控制台](https://console.cloud.tencent.com/smsv2)
- **注意**: 必须先通过审核
- **示例**:
  ```bash
  SMS_SIGN_NAME=Chpli应用
  ```

### SMS_TEMPLATE_ID

- **说明**: 短信模板 ID
- **类型**: `string`
- **获取**: [腾讯云短信控制台](https://console.cloud.tencent.com/smsv2)
- **注意**: 模板内容需包含 `{1}` 作为验证码占位符
- **示例**:
  ```bash
  SMS_TEMPLATE_ID=1234567
  ```

### SES_FROM_EMAIL

- **说明**: 发件人邮箱地址
- **类型**: `string`
- **获取**: [腾讯云邮件控制台](https://console.cloud.tencent.com/ses)
- **注意**: 必须先验证发件域名
- **示例**:
  ```bash
  SES_FROM_EMAIL=noreply@yourdomain.com
  ```

---

## 📝 完整配置示例

### 开发环境 (.env.development)

```bash
# 基础配置
NODE_ENV=development
PORT=3001

# 数据库（本地 PostgreSQL）
DATABASE_URL="postgresql://chpli:chpli_secret@localhost:5432/chpli?schema=calendar_memo"

# JWT（开发环境使用简单密钥）
JWT_SECRET=dev-jwt-secret-key-not-for-production
JWT_EXPIRES_IN=7d

# 腾讯云（开发环境可留空，验证码会输出到控制台）
TENCENT_SECRET_ID=
TENCENT_SECRET_KEY=
SMS_SIGN_NAME=
SMS_TEMPLATE_ID=
SES_FROM_EMAIL=
```

### 生产环境 (.env.production)

```bash
# 基础配置
NODE_ENV=production
PORT=3001

# 数据库（生产 PostgreSQL）
DATABASE_URL="postgresql://chpli:secure_password@prod-db.example.com:5432/chpli?schema=calendar_memo&connection_limit=20"

# JWT（必须随机生成）
JWT_SECRET=a1b2c3d4e5f6...（32位以上随机字符串）
JWT_EXPIRES_IN=7d

# 腾讯云（生产环境必填）
TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxx
SMS_SIGN_NAME=Chpli应用
SMS_TEMPLATE_ID=1234567
SES_FROM_EMAIL=noreply@yourdomain.com
```

### Docker 环境 (.env.docker)

```bash
# 基础配置
NODE_ENV=production
PORT=3001

# 数据库（使用服务名连接）
DATABASE_URL="postgresql://chpli:chpli_secret@postgres:5432/chpli?schema=calendar_memo"

# JWT
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=7d

# 腾讯云
TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxx
SMS_SIGN_NAME=Chpli应用
SMS_TEMPLATE_ID=1234567
SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## ⚠️ 安全注意事项

1. **生产环境必须修改 JWT_SECRET**
   - 使用随机生成的强密钥
   - 至少 32 个字符
   - 定期轮换（建议每 3-6 个月）

2. **保护腾讯云密钥**
   - 不要将密钥提交到 Git
   - 使用环境变量或密钥管理服务
   - 定期轮换密钥
   - 限制密钥权限（最小权限原则）

3. **数据库密码**
   - 使用强密码
   - 定期更换
   - 限制数据库访问 IP

4. **环境变量文件**
   - `.env` 文件已添加到 `.gitignore`
   - 生产环境使用 Docker Secrets 或 KMS

---

## 🔍 验证配置

启动服务时会自动检查关键环境变量：

```bash
pnpm dev

# 控制台输出：
# [Server] Running on http://localhost:3001
# [Database] Connected successfully
# [JWT] Secret configured
```

如果缺少关键配置，会输出警告信息。
