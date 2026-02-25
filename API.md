# API 接口文档

Base URL: `http://localhost:3001/api`

## 1. 备忘录 (Memos)

### GET /memos
获取所有备忘录（不含重复实例，前端根据 repeat 规则动态计算）

**Query Parameters**:
- `startDate` (optional): ISO 日期字符串，筛选开始日期之后
- `endDate` (optional): ISO 日期字符串，筛选结束日期之前
- `tags` (optional): 逗号分隔的标签 ID，OR 逻辑筛选
- `priorities` (optional): 逗号分隔的优先级 (high/medium/low)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "完成项目文档",
      "description": "编写技术设计文档",
      "location": "办公室",
      "date": "2026-03-30",
      "completed": false,
      "repeatType": "weekly",
      "repeatEndType": "never",
      "repeatEndDate": null,
      "priority": "high",
      "imageUrl": "/uploads/xxx.jpg",
      "tags": [
        { "id": "tag-1", "name": "工作", "color": "#FF6B6B" }
      ],
      "createdAt": "2026-03-30T10:00:00Z",
      "updatedAt": "2026-03-30T10:00:00Z"
    }
  ]
}
```

### GET /memos/:id
获取单个备忘录详情

### POST /memos
创建备忘录

**Request Body**:
```json
{
  "title": "string (required, max 200)",
  "description": "string (optional)",
  "location": "string (optional)",
  "date": "YYYY-MM-DD (required)",
  "completed": false,
  "repeatType": "none | weekly | biweekly | monthly | quarterly | semiannual | yearly",
  "repeatEndType": "never | onDate",
  "repeatEndDate": "YYYY-MM-DD (optional)",
  "priority": "high | medium | low | null",
  "tagIds": ["uuid"],
  "imageUrl": "string (optional)"
}
```

**注意**: 创建重复备忘录时，只创建一条记录，前端负责渲染未来实例。

### PUT /memos/:id
更新备忘录（全量更新）

### DELETE /memos/:id
删除备忘录

**Query Parameters**:
- `scope` (optional): 
  - `single` (默认): 仅删除此条（对于重复事件，需在数据库标记例外日期，暂未实现，先不支持删除单条重复实例）
  - `all`: 删除整个重复系列

**当前简化实现**: 直接删除记录，不处理重复实例的单个删除。

### PATCH /memos/:id/toggle
切换完成状态

**Response**:
```json
{
  "success": true,
  "data": { "completed": true }
}
```

## 2. 标签 (Tags)

### GET /tags
获取所有标签

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "工作",
      "color": "#FF6B6B",
      "count": 5  // 关联备忘录数量
    }
  ]
}
```

### POST /tags
创建标签

**Request Body**:
```json
{
  "name": "string (required, unique)",
  "color": "string (hex color, optional, default随机)"
}
```

### PUT /tags/:id
更新标签

### DELETE /tags/:id
删除标签（检查是否有备忘录引用，如有拒绝删除或级联删除，选择级联删除关联关系）

## 3. 文件上传 (Upload)

### POST /upload
上传图片

**Request**: `Content-Type: multipart/form-data`
- `file`: 图片文件 (jpg/png/gif, max 5MB)

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "/uploads/uuid.jpg",
    "filename": "uuid.jpg",
    "size": 1024
  }
}
```

### DELETE /upload/:filename
删除图片（会检查是否被备忘录引用，如被引用拒绝删除）

## 4. 日历数据 (Calendar)

### GET /calendar/range
获取指定范围的备忘录（已展开重复规则）

**Query Parameters**:
- `start`: YYYY-MM-DD
- `end`: YYYY-MM-DD
- `includeRepeating`: boolean (default true)

**Response**:
```json
{
  "success": true,
  "data": {
    "2026-03-30": [
      { /* memo object with isRepeatInstance: false */ },
      { /* memo object with isRepeatInstance: true, originalId: "uuid" */ }
    ],
    "2026-03-31": [...]
  }
}
```

**注意**: 此端点可选实现，如果前端计算性能好，可省略此端点，由前端根据 GET /memos 结果自行计算。

## 5. 错误码对照表

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | 参数校验失败 |
| 404 | MEMO_NOT_FOUND | 备忘录不存在 |
| 404 | TAG_NOT_FOUND | 标签不存在 |
| 409 | DUPLICATE_TAG | 标签名已存在 |
| 413 | FILE_TOO_LARGE | 文件超过 5MB |
| 415 | INVALID_FILE_TYPE | 仅支持 jpg/png/gif |
| 500 | INTERNAL_ERROR | 服务器内部错误 |
