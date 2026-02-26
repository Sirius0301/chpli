/**
 * 共享类型定义
 * 前后端通用，确保类型安全
 */

// ==================== 基础枚举 ====================

export type RepeatType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

export type RepeatEndType = 'never' | 'onDate';

export type Priority = 'high' | 'medium' | 'low';

// ==================== 实体接口 ====================

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  count?: number; // 后端统计的标签使用次数
}

export interface Memo {
  id: string;
  title: string;
  description?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  repeatType: RepeatType;
  repeatEndType: RepeatEndType;
  repeatEndDate?: string; // YYYY-MM-DD
  priority?: Priority;
  imageUrl?: string;
  tags: Tag[]; // 关联标签，后端查询时组装
  createdAt: string;
  updatedAt: string;
}

// ==================== DTO (数据传输对象) ====================

// 创建备忘录请求
export interface CreateMemoDTO {
  title: string;
  description?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  completed?: boolean;
  repeatType?: RepeatType;
  repeatEndType?: RepeatEndType;
  repeatEndDate?: string;
  priority?: Priority;
  tagIds?: string[];
  imageUrl?: string;
}

// 更新备忘录请求 (Partial)
export type UpdateMemoDTO = Partial<CreateMemoDTO>;

// 创建标签请求
export interface CreateTagDTO {
  name: string;
  color?: string;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 备忘录查询参数
export interface MemoQueryParams {
  startDate?: string;
  endDate?: string;
  tags?: string[]; // 标签ID数组，OR逻辑
  priorities?: Priority[];
}

// 日历范围响应（展开重复规则后）
export interface CalendarRangeResponse {
  [date: string]: MemoWithInstance[];
}

// 带实例标记的备忘录（前端生成重复实例时使用）
export interface MemoWithInstance extends Memo {
  isRepeatInstance?: boolean; // 是否是生成的重复实例
  originalId?: string;        // 如果是实例，指向原始ID
  instanceDate?: string;      // 实例的具体日期
}

// ==================== 前端专用类型 ====================

export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarCell {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  lunarDate?: {
    month: string;
    day: string;
    jieQi?: string;
  };
  memos: MemoWithInstance[];
}
