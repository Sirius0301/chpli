import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Memo, Tag, ViewMode, MemoWithInstance } from '@chpli/calendar-memo-shared';
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
  isHighlightToday: boolean; // 高亮今天的备忘录
  isSidebarOpen: boolean; // 侧边栏展开状态（小屏幕用）
  isSidebarCollapsed: boolean; // 侧边栏收缩状态（大屏幕用）

  // 筛选状态
  selectedTags: string[];
  selectedPriorities: ('high' | 'medium' | 'low')[];

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  setHighlightToday: (value: boolean) => void;
  selectToday: () => void;
  selectMemo: (id: string | null) => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarCollapse: () => void;
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
  // 修改：支持传递 instanceDate 参数
  toggleMemoComplete: (id: string, instanceDate?: string) => Promise<void>;
  createTag: (data: { name: string; color?: string }) => Promise<void>;
  updateTag: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
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
        isHighlightToday: false,
        isSidebarOpen: false,
        isSidebarCollapsed: false,
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
          set({ selectedDate: date, isHighlightToday: false });
          get().expandMemosForRange();
        },

        setHighlightToday: (value) => set({ isHighlightToday: value }),

        selectToday: () => {
          const today = new Date();
          set({ selectedDate: today, isHighlightToday: true });
          get().expandMemosForRange();
        },

        selectMemo: (id) => set({ selectedMemoId: id }),

        openDetailPanel: () => set({ isDetailPanelOpen: true }),
        closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedMemoId: null }),
        toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
        openSidebar: () => set({ isSidebarOpen: true }),
        closeSidebar: () => set({ isSidebarOpen: false }),
        toggleSidebarCollapse: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

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
            const token = localStorage.getItem('token');
            console.log('[fetchMemos] Token exists:', !!token);
            
            const response = await memoApi.getAll();
            console.log('[fetchMemos] API response:', response);
            if (response.success) {
              const memos = response.data || [];
              console.log('[fetchMemos] Memos count:', memos.length);
              if (memos.length > 0) {
                console.log('[fetchMemos] First memo sample:', memos[0]);
                console.log('[fetchMemos] Memo date field:', memos[0].date);
              }
              set({ memos });
              get().expandMemosForRange();
            } else {
              console.error('[fetchMemos] API returned error:', response.message);
              set({ error: response.message || '获取失败' });
            }
          } catch (err: any) {
            console.error('[fetchMemos] Error:', err);
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
          console.log('[expandMemosForRange] Input memos:', memos.length, 'selectedDate:', selectedDate, 'viewMode:', viewMode);

          // 确定日期范围
          let rangeStart: Date, rangeEnd: Date;
          if (viewMode === 'day') {
            // Day 视图：只显示当天
            rangeStart = new Date(selectedDate);
            rangeEnd = new Date(selectedDate);
          } else if (viewMode === 'week') {
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
            
            // 为每个实例计算完成状态
            for (const instance of instances) {
              // 如果是重复备忘录的实例
              if (memo.repeatType !== 'none') {
                // 检查 completions 数组
                const completionRecord = memo.completions?.find(
                  c => c.instanceDate === instance.instanceDate
                );
                if (completionRecord) {
                  // 如果存在完成记录，使用该记录的状态
                  instance.completed = completionRecord.completed;
                } else {
                  // 如果不存在完成记录，默认为未完成
                  // 这样每个实例都是独立的，不会互相影响
                  instance.completed = false;
                }
              }
              // 对于非重复备忘录，保持原有的 completed 状态
            }
            
            expanded.push(...instances);
          }

          // 应用筛选（标签 AND 逻辑，优先级 OR 逻辑，两者间 AND 逻辑）
          if (selectedTags.length > 0) {
            expanded = expanded.filter(memo => 
              // AND 逻辑：备忘录必须包含所有选中的标签
              selectedTags.every(tagId => memo.tags.some(tag => tag.id === tagId))
            );
          }

          if (selectedPriorities.length > 0) {
            expanded = expanded.filter(memo => 
              memo.priority && selectedPriorities.includes(memo.priority)
            );
          }

          // 按日期排序
          expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          console.log('[expandMemosForRange] Output expanded:', expanded.length);
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

        // 修改：支持传递 instanceDate 参数
        toggleMemoComplete: async (id, instanceDate) => {
          try {
            await memoApi.toggleComplete(id, instanceDate ? { instanceDate } : undefined);
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

        updateTag: async (id, data) => {
          try {
            await tagApi.update(id, data);
            await get().fetchTags();
            // 更新标签后刷新备忘录列表（因为备忘录中嵌入了标签信息）
            await get().fetchMemos();
          } catch (err) {
            console.error('Update tag failed:', err);
          }
        },

        deleteTag: async (id) => {
          try {
            await tagApi.delete(id);
            await get().fetchTags();
            // 删除标签后刷新备忘录列表
            await get().fetchMemos();
          } catch (err) {
            console.error('Delete tag failed:', err);
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
