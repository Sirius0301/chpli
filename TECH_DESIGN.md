# 技术架构设计文档 (TECH_DESIGN)

## 1. 架构概览

```
┌─────────────────┐         ┌──────────────────┐
│   React (Vite)  │ ←─────→ │  Express (Node)  │
│   Port: 5173    │  HTTP   │   Port: 3001     │
└─────────────────┘         └────────┬─────────┘
                                     │
                              ┌──────▼──────┐
                              │  better-    │
                              │  sqlite3    │
                              └─────────────┘
                                     │
                              ┌──────▼──────┐
                              │  uploads/   │
                              │  (本地存储)  │
                              └─────────────┘
```

## 2. 核心设计决策

### 2.1 重复规则实现 (方案 A)
**策略**: 前端动态计算，后端仅存储规则定义

**算法逻辑**:
```typescript
// 判断某日期是否匹配重复规则
function isMatch(memo: Memo, targetDate: Date): boolean {
  const start = new Date(memo.date);
  const target = new Date(targetDate);

  // 检查是否在结束日期之后
  if (memo.repeatEndType === 'onDate' && memo.repeatEndDate) {
    if (target > new Date(memo.repeatEndDate)) return false;
  }

  // 检查是否在开始日期之前
  if (target < start) return false;

  switch (memo.repeatType) {
    case 'weekly':
      return target.getDay() === start.getDay() && 
             weeksBetween(start, target) % 1 === 0;
    case 'biweekly': 
      return target.getDay() === start.getDay() && 
             weeksBetween(start, target) % 2 === 0;
    case 'monthly':
      return target.getDate() === start.getDate();
    case 'quarterly': // 3 months
      return target.getDate() === start.getDate() && 
             monthsBetween(start, target) % 3 === 0;
    case 'semiannual': // 6 months
      return target.getDate() === start.getDate() && 
             monthsBetween(start, target) % 6 === 0;
    case 'yearly':
      return target.getDate() === start.getDate() && 
             target.getMonth() === start.getMonth();
    default:
      return isSameDay(target, start);
  }
}
```

**优点**:
- 无需生成大量重复实例记录
- 修改重复规则时无需级联更新子记录
- 适合个人单机使用场景

**性能考虑**:
- 月视图最多显示 42 天，需检查所有备忘录是否匹配
- 使用 Web Worker 或 useMemo 缓存计算结果
- 一次性加载所有非重复备忘录，前端内存计算

### 2.2 标签筛选逻辑 (OR/并集)
- 用户选择标签 ["工作", "重要"] 时
- 显示包含 "工作" **或** "重要" 的所有备忘录
- 空选择 = 显示全部

### 2.3 农历与节气支持
使用 `lunar-javascript` 库:
```typescript
import { Solar, Lunar } from 'lunar-javascript';

const solar = Solar.fromDate(date);
const lunar = solar.getLunar();
const lunarStr = lunar.getMonthInChinese() + lunar.getDayInChinese(); // "二月十一"
const jieQi = lunar.getJieQi(); // "立春" 或 null
```

### 2.4 图片存储策略
- 上传: 通过 `/api/upload` 接口保存到 `server/uploads/`
- 存储: 数据库保存相对路径 `/uploads/filename.jpg`
- 访问: 后端提供静态文件服务 `app.use('/uploads', express.static(...))`
- 命名: UUID + 原始扩展名，避免冲突

### 2.5 数据同步策略
- **无实时 WebSocket**: 采用 HTTP REST API，定期轮询（每 30 秒）或手动刷新
- **乐观更新**: UI 先更新，API 失败后回滚
- **本地缓存**: 使用 Zustand 持久化到 localStorage，离线可用

## 3. 前端架构

### 3.1 状态管理 (Zustand)
```typescript
// stores/memoStore.ts
interface MemoStore {
  memos: Memo[];
  selectedDate: Date;
  viewMode: 'week' | 'month';
  selectedTags: string[];
  selectedPriorities: Priority[];

  // Actions
  fetchMemos: () => Promise<void>;
  createMemo: (memo: CreateMemoDTO) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  setViewMode: (mode: 'week' | 'month') => void;
}
```

### 3.2 组件层级
```
App
├── Layout
│   ├── Sidebar (标签筛选/优先级)
│   ├── MainContent
│   │   ├── Header (Week/Month 切换, 导航)
│   │   ├── CalendarGrid
│   │   │   ├── WeekView (7 列网格)
│   │   │   │   └── DayCell
│   │   │   │       └── MemoItem []
│   │   │   └── MonthView (6x7 网格)
│   │   │       └── DayCell
│   │   │           └── MemoItem []
│   │   └── DetailPanel (右侧详情/编辑)
│   └── QuickAddModal
```

### 3.3 日期计算工具类
```typescript
// utils/calendar.ts
export class CalendarHelper {
  static getWeekDays(currentDate: Date): Date[];
  static getMonthDays(currentDate: Date): Date[][]; // 6x7 数组
  static getLunarDate(date: Date): { month: string; day: string; jieQi?: string };
  static generateRepeatingInstances(memo: Memo, rangeStart: Date, rangeEnd: Date): Date[];
}
```

## 4. 后端架构

### 4.1 目录结构
```
server/src/
├── index.ts          # 入口，中间件配置
├── db/
│   ├── index.ts      # better-sqlite3 连接
│   ├── schema.sql    # 建表语句
│   └── migrations/   # 数据库迁移
├── routes/
│   ├── memos.ts      # /api/memos CRUD
│   ├── tags.ts       # /api/tags
│   └── upload.ts     # /api/upload
└── utils/
    └── fileStorage.ts # 文件上传处理
```

### 4.2 数据库访问模式 (better-sqlite3)
使用同步 API（适合 SQLite 单机场景）:
```typescript
// db/index.ts
import Database from 'better-sqlite3';

const db = new Database('database.sqlite');
db.exec(schema);

// 预处理语句缓存
const statements = {
  getAllMemos: db.prepare('SELECT * FROM memos ORDER BY date DESC'),
  createMemo: db.prepare(`
    INSERT INTO memos (id, title, description, location, date, priority, repeat_type, repeat_end_type, repeat_end_date, image_url)
    VALUES (@id, @title, @description, @location, @date, @priority, @repeatType, @repeatEndType, @repeatEndDate, @imageUrl)
  `),
  // ...
};

export { db, statements };
```

### 4.3 API 错误处理
统一错误格式:
```json
{
  "success": false,
  "error": "MEMO_NOT_FOUND",
  "message": "备忘录不存在"
}
```

## 5. 安全与边界情况

### 5.1 输入验证
- 使用 Zod 进行运行时类型检查
- SQL 注入防护: 使用参数化查询 (better-sqlite3 自动处理)
- 文件上传限制: 仅允许 jpg/png/gif, 最大 5MB

### 5.2 并发处理
- SQLite 在写入时会锁定整个数据库
- 避免高频写入操作
- 图片上传使用临时文件名，完成后原子重命名

### 5.3 日期边界
- 时区处理: 统一使用本地时间（用户所在时区）
- 跨天问题: 备忘录只精确到日期，不涉及时分秒
- 农历闰月: lunar-javascript 自动处理

## 6. 性能优化

### 6.1 前端优化
- 虚拟列表: 月视图备忘录多时只渲染可视区域
- 日期计算缓存: 使用 memoize-one 缓存农历计算
- 图片懒加载: 使用 loading="lazy"

### 6.2 后端优化
- 数据库索引:
  ```sql
  CREATE INDEX idx_memos_date ON memos(date);
  CREATE INDEX idx_memos_repeat ON memos(repeat_type) WHERE repeat_type != 'none';
  CREATE INDEX idx_memo_tags ON memo_tags(memo_id, tag_id);
  ```
- 图片压缩: 上传时生成缩略图（可选 Phase 2）
