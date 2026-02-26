# Calendar Memo API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (`Authorization: Bearer <token>`)

## 响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },      // 可选
  "message": "操作成功"  // 可选
}

// 错误响应
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误描述"
}
```

---

## 🔐 认证模块

### 1. 发送验证码

发送验证码到邮箱或手机，用于注册、找回密码、修改密码。

```http
POST /auth/send-code
```

**请求体**:
```json
{
  "email": "user@example.com",  // 邮箱或手机号二选一
  "phone": "13800138000",
  "type": "REGISTER"  // REGISTER | RESET_PASSWORD | CHANGE_PASSWORD
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码已发送",
  "code": "123456"  // 仅在开发环境返回
}
```

**限流规则**:
- 每小时最多 5 次
- 验证码 10 分钟有效

**错误码**:
- `VALIDATION_ERROR` - 参数验证失败
- `RATE_LIMIT` - 发送过于频繁
- `SEND_FAILED` - 发送失败

---

### 2. 用户注册

```http
POST /auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",  // 邮箱或手机号二选一
  "phone": "13800138000",
  "code": "123456",           // 验证码
  "password": "Pass123!@#",   // 密码需满足强度要求
  "name": "张三"               // 用户名
}
```

**密码要求**:
- 长度 ≥ 8 位
- 包含中文或英文字符
- 包含数字
- 包含特殊字符（`!@#$%^&*()_+-=[]{}|;':",./<>?`）

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": null,
      "name": "张三",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "注册成功"
}
```

**错误码**:
- `VALIDATION_ERROR` - 参数验证失败
- `WEAK_PASSWORD` - 密码强度不足
- `USER_EXISTS` - 用户已存在
- `INVALID_CODE` - 验证码错误

---

### 3. 用户登录

支持邮箱或手机号 + 密码登录。

```http
POST /auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",  // 邮箱或手机号二选一
  "phone": "13800138000",
  "password": "Pass123!@#"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": null,
      "name": "张三",
      "isActive": true,
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "登录成功"
}
```

**安全提示**:
- 密码错误返回统一提示："账号或密码错误"
- 不暴露具体是哪个字段错误

**错误码**:
- `VALIDATION_ERROR` - 参数验证失败
- `INVALID_CREDENTIALS` - 账号或密码错误
- `ACCOUNT_DISABLED` - 账号已被禁用

---

### 4. 重置密码（找回密码）

```http
POST /auth/reset-password
```

**请求体**:
```json
{
  "email": "user@example.com",  // 邮箱或手机号二选一
  "phone": "13800138000",
  "code": "123456",
  "newPassword": "NewPass123!@#"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

**错误码**:
- `VALIDATION_ERROR` - 参数验证失败
- `WEAK_PASSWORD` - 密码强度不足
- `INVALID_CODE` - 验证码错误
- `USER_NOT_FOUND` - 用户不存在

---

### 5. 修改密码（需登录）

```http
POST /auth/change-password
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "code": "123456",              // 验证码（需先调用 send-code，type=CHANGE_PASSWORD）
  "oldPassword": "OldPass123!@#",
  "newPassword": "NewPass123!@#"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误码**:
- `UNAUTHORIZED` - 未登录
- `INVALID_PASSWORD` - 原密码错误
- `WEAK_PASSWORD` - 新密码强度不足
- `INVALID_CODE` - 验证码错误

---

### 6. 获取当前用户信息

```http
GET /auth/me
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": null,
    "name": "张三",
    "avatar": null,
    "isActive": true,
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误码**:
- `UNAUTHORIZED` - 未登录或 Token 过期
- `USER_NOT_FOUND` - 用户不存在

---

## 📝 备忘录模块

> **注意**: 以下接口需要登录，需在请求头中携带 `Authorization: Bearer <token>`

### 获取备忘录列表

```http
GET /memos?startDate=2024-01-01&endDate=2024-01-31&tags[]=tag1&priorities[]=high
```

**查询参数**:
- `startDate` - 开始日期（YYYY-MM-DD）
- `endDate` - 结束日期（YYYY-MM-DD）
- `tags` - 标签 ID 数组（AND 逻辑）
- `priorities` - 优先级数组（high/medium/low）

---

### 创建备忘录

```http
POST /memos
```

**请求体**:
```json
{
  "title": "会议",
  "description": "项目周会",
  "location": "会议室A",
  "date": "2024-01-15",
  "priority": "high",
  "repeatType": "weekly",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

---

### 更新备忘录

```http
PUT /memos/:id
```

---

### 删除备忘录

```http
DELETE /memos/:id
```

---

### 切换完成状态

```http
PATCH /memos/:id/toggle
```

---

## 🏷️ 标签模块

### 获取标签列表

```http
GET /tags
```

### 创建标签

```http
POST /tags
```

**请求体**:
```json
{
  "name": "工作",
  "color": "#3b82f6"
}
```

### 删除标签

```http
DELETE /tags/:id
```

---

## 📤 上传模块

### 上传图片

```http
POST /upload/image
Content-Type: multipart/form-data
```

**请求体**:
- `file` - 图片文件（jpg/png/gif，最大 5MB）

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "/uploads/xxx.jpg",
    "filename": "xxx.jpg"
  }
}
```

---

## 🔒 认证中间件

受保护的路由需要携带 JWT Token：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Token 过期**:
- 默认有效期：7 天
- 过期后返回：`{ "error": "INVALID_TOKEN", "message": "登录已过期" }`

---

## ❌ 全局错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `UNAUTHORIZED` | 401 | 未登录或 Token 无效 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMIT` | 429 | 请求过于频繁 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
