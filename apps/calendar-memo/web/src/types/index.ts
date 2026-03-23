// 从 shared 复制类型定义
// 当修改 shared/types/index.ts 时，需要同步修改此文件

export type RepeatType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly' | 'custom';

export type RepeatEndType = 'never' | 'onDate';

export type Priority = 'high' | 'medium' | 'low';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  count?: number;
}

export interface MemoCompletion {
  id: string;
  memoId: string;
  instanceDate: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  completed: boolean;
  repeatType: RepeatType;
  repeatEndType: RepeatEndType;
  repeatEndDate?: string;
  customDays?: number[];
  priority?: Priority;
  imageUrl?: string;
  tags: Tag[];
  completions?: MemoCompletion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoDTO {
  title: string;
  description?: string;
  location?: string;
  date: string;
  completed?: boolean;
  repeatType?: RepeatType;
  repeatEndType?: RepeatEndType;
  repeatEndDate?: string;
  customDays?: number[];
  priority?: Priority;
  tagIds?: string[];
  imageUrl?: string;
}

export type UpdateMemoDTO = Partial<CreateMemoDTO>;

export interface ToggleCompleteDTO {
  instanceDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MemoQueryParams {
  startDate?: string;
  endDate?: string;
  tags?: string[];
  priorities?: Priority[];
}

export interface CalendarRangeResponse {
  [date: string]: MemoWithInstance[];
}

export interface MemoWithInstance extends Memo {
  isRepeatInstance?: boolean;
  originalId?: string;
  instanceDate?: string;
}

export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarCell {
  date: string;
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
