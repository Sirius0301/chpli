import { useSuggestions, useDismissSuggestion, useDeleteBookmark } from '@/hooks/useBookmarks'
import { X, Trash2 } from 'lucide-react'

export default function SuggestionList() {
  const { data: suggestions, isLoading } = useSuggestions()
  const dismissMutation = useDismissSuggestion()
  const deleteMutation = useDeleteBookmark()

  if (isLoading) return <div className="text-sm text-gray-400">加载中...</div>
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">建议删除</h3>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div
            key={s.bookmark.id}
            className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800"
          >
            <div className="text-sm font-medium truncate">{s.bookmark.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {s.days_since_click !== undefined ? `${s.days_since_click} 天未点击` : '从未点击'}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => dismissMutation.mutate(s.bookmark.id)}
                className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                忽略30天
              </button>
              <button
                onClick={() => deleteMutation.mutate(s.bookmark.id)}
                className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1"
              >
                <Trash2 size={10} />
                立即删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
