import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Memo, Tag, ViewMode, MemoWithInstance } from '@calendar-memo/types';
import { memoApi, tagApi } from '@/utils/api';
import { getWeekDays, getMonthDays, expandMemoToRange, formatDate, parseDate } from '@/utils/calendar';

interface MemoState {
  // 数据
  memos: Memo[];
  tags: Tag[];
  expandedMemos: MemoWithInstance[]; // 展开重复规则后的备忘录

  // UI 状态
  viewMode: ViewMode;
  selectedDate: Date;
  selectedMemoId: string | null;
  isDetailPanelOpen: boolean;

  // 筛选状态
  selectedTags: string[];
  selectedPriorities: ('high' | 'medium' | 'low')[];

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  selectMemo: (id: string | null) => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  toggleTagFilter: (tagId: string) => void;
  togglePriorityFilter: (priority: 'high' | 'medium' | 'low') => void;
  clearFilters: () => void;

  // 数据操作
  fetchMemos: () => Promise<void>;
  fetchTags: () => Promise<void>;
  expandMemosForRange: () => void;
  createMemo: (data: any) => Promise<void>;
  updateMemo: (id: string, data: any) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  toggleMemoComplete: (id: string) => Promise<void>;
  createTag: (data: { name: string; color?: string }) => Promise<void>;
}

export const useMemoStore = create<MemoState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        memos: [],
        tags: [],
        expandedMemos: [],
        viewMode: 'week',
        selectedDate: new Date(),
        selectedMemoId: null,
        isDetailPanelOpen: false,
        selectedTags: [],
        selectedPriorities: [],
        isLoading: false,
        error: null,

        // UI Actions
        setViewMode: (mode) => {
          set({ viewMode: mode });
          get().expandMemosForRange();
        },

        setSelectedDate: (date) => {
          set({ selectedDate: date });
          get().expandMemosForRange();
        },

        selectMemo: (id) => set({ selectedMemoId: id }),

        openDetailPanel: () => set({ isDetailPanelOpen: true }),
        closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedMemoId: null }),

        // 筛选 Actions
        toggleTagFilter: (tagId) => {
          const { selectedTags } = get();
          const newTags = selectedTags.includes(tagId)
            ? selectedTags.filter(id => id !== tagId)
            : [...selectedTags, tagId];
          set({ selectedTags: newTags });
          get().expandMemosForRange();
        },

        togglePriorityFilter: (priority) => {
          const { selectedPriorities } = get();
          const newPriorities = selectedPriorities.includes(priority)
            ? selectedPriorities.filter(p => p !== priority)
            : [...selectedPriorities, priority];
          set({ selectedPriorities: newPriorities });
          get().expandMemosForRange();
        },

        clearFilters: () => {
          set({ selectedTags: [], selectedPriorities: [] });
          get().expandMemosForRange();
        },

        // 数据 Actions
        fetchMemos: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await memoApi.getAll();
            if (response.success) {
              set({ memos: response.data || [] });
              get().expandMemosForRange();
            } else {
              set({ error: response.message || '获取失败' });
            }
          } catch (err: any) {
            set({ error: err.message || '网络错误' });
          } finally {
            set({ isLoading: false });
          }
        },

        fetchTags: async () => {
          try {
            const response = await tagApi.getAll();
            if (response.success) {
              set({ tags: response.data || [] });
            }
          } catch (err) {
            console.error('Fetch tags failed:', err);
          }
        },

        // 核心算法：展开重复规则
        expandMemosForRange: () => {
          const { memos, selectedDate, viewMode, selectedTags, selectedPriorities } = get();

          // 确定日期范围
          let rangeStart: Date, rangeEnd: Date;
          if (viewMode === 'week') {
            const weekDays = getWeekDays(selectedDate);
            rangeStart = weekDays[0];
            rangeEnd = weekDays[6];
          } else {
            const monthWeeks = getMonthDays(selectedDate);
            rangeStart = monthWeeks[0][0];
            rangeEnd = monthWeeks[monthWeeks.length - 1][6];
          }

          // 展开所有备忘录
          let expanded: MemoWithInstance[] = [];
          for (const memo of memos) {
            const instances = expandMemoToRange(memo, rangeStart, rangeEnd);
            expanded.push(...instances);
          }

          // 应用筛选（标签 OR 逻辑，优先级 OR 逻辑，两者间 AND 逻辑）
          if (selectedTags.length > 0) {
            expanded = expanded.filter(memo => 
              memo.tags.some(tag => selectedTags.includes(tag.id))
            );
          }

          if (selectedPriorities.length > 0) {
            expanded = expanded.filter(memo => 
              memo.priority && selectedPriorities.includes(memo.priority)
            );
          }

          // 按日期排序
          expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          set({ expandedMemos: expanded });
        },

        createMemo: async (data) => {
          set({ isLoading: true });
          try {
            const response = await memoApi.create(data);
            if (response.success) {
              await get().fetchMemos();
              get().closeDetailPanel();
            } else {
              set({ error: response.message });
            }
          } catch (err: any) {
            set({ error: err.message });
          } finally {
            set({ isLoading: false });
          }
        },

        updateMemo: async (id, data) => {
          set({ isLoading: true });
          try {
            const response = await memoApi.update(id, data);
            if (response.success) {
              await get().fetchMemos();
              get().closeDetailPanel();
            }
          } catch (err: any) {
            set({ error: err.message });
          } finally {
            set({ isLoading: false });
          }
        },

        deleteMemo: async (id) => {
          try {
            await memoApi.delete(id);
            await get().fetchMemos();
            get().closeDetailPanel();
          } catch (err) {
            console.error('Delete failed:', err);
          }
        },

        toggleMemoComplete: async (id) => {
          try {
            await memoApi.toggleComplete(id);
            await get().fetchMemos();
          } catch (err) {
            console.error('Toggle failed:', err);
          }
        },

        createTag: async (data) => {
          try {
            await tagApi.create(data);
            await get().fetchTags();
          } catch (err) {
            console.error('Create tag failed:', err);
          }
        },
      }),
      {
        name: 'calendar-memo-storage',
        partialize: (state) => ({ 
          viewMode: state.viewMode,
          selectedTags: state.selectedTags,
          selectedPriorities: state.selectedPriorities,
        }), // 只持久化 UI 偏好，不缓存数据
      }
    )
  )
);
