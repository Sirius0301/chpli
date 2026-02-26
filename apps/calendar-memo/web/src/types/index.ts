// 前端专用类型扩展
import type { Memo, Tag, ViewMode } from '@chpli/calendar-memo-shared';

export interface MemoFormData {
  title: string;
  description: string;
  location: string;
  date: string;
  completed: boolean;
  repeatType: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
  repeatEndType: 'never' | 'onDate';
  repeatEndDate: string;
  priority: 'high' | 'medium' | 'low' | '';
  tagIds: string[];
  imageUrl: string;
}

export interface FilterState {
  selectedTags: string[];
  selectedPriorities: ('high' | 'medium' | 'low')[];
}

export { Memo, Tag, ViewMode };
