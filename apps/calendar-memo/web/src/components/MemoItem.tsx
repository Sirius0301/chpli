import { useMemoStore } from '@/stores/memoStore';
import type { MemoWithInstance } from '@chpli/calendar-memo-shared';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MemoItemProps {
  memo: MemoWithInstance;
  isHighlighted?: boolean;
}

export function MemoItem({ memo, isHighlighted = false }: MemoItemProps) {
  const { 
    toggleMemoComplete, 
    selectMemo, 
    openDetailPanel,
    setSelectedDate,
  } = useMemoStore();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleMemoComplete(memo.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (memo.instanceDate) {
      setSelectedDate(new Date(memo.instanceDate));
    } else {
      setSelectedDate(new Date(memo.date));
    }
    selectMemo(memo.id);
    openDetailPanel();
  };

  // 优先级颜色
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-blue-500',
  };

  return (
    <div 
      className={cn(
        "memo-item group flex items-start gap-2 px-2 py-1.5 rounded text-sm hover:bg-white hover:shadow-sm transition-all border-l-2 cursor-pointer",
        memo.completed ? 'opacity-50' : 'opacity-100',
        memo.priority ? priorityColors[memo.priority] : 'border-l-transparent',
        memo.isRepeatInstance ? 'bg-gray-50' : 'bg-white',
        isHighlighted && 'bg-green-100 shadow-md ring-1 ring-green-300'
      )}
      onClick={handleClick}
    >
      {/* 复选框 */}
      <input
        type="checkbox"
        checked={memo.completed}
        onChange={() => {}} // React 受控组件需要 onChange
        onClick={handleToggle}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500 cursor-pointer"
      />

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {/* 名称 */}
        <div className={cn(
          "truncate",
          memo.completed && "line-through text-gray-400"
        )}>
          {memo.title}
        </div>

        {/* 备注信息 */}
        {memo.description && (
          <div className={cn(
            "text-xs text-gray-500 mt-0.5 line-clamp-2",
            memo.completed && "text-gray-400"
          )}>
            {memo.description}
          </div>
        )}

        {/* 标签展示 */}
        {memo.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {memo.tags.slice(0, 2).map(tag => (
              <span 
                key={tag.id} 
                className="text-[10px] px-1 rounded bg-gray-100 text-gray-600"
              >
                {tag.name}
              </span>
            ))}
            {memo.tags.length > 2 && (
              <span className="text-[10px] text-gray-400">+{memo.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* 重复标记 */}
      {memo.repeatType !== 'none' && (
        <svg className="w-3 h-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
    </div>
  );
}
