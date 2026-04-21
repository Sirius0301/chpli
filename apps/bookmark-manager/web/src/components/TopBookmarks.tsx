import { useTopBookmarks, useClickBookmark } from '@/hooks/useBookmarks'
import { ExternalLink } from 'lucide-react'

export default function TopBookmarks() {
  const { data: bookmarks, isLoading } = useTopBookmarks()
  const clickMutation = useClickBookmark()

  if (isLoading) return <div className="text-sm text-gray-400">加载中...</div>
  if (!bookmarks || bookmarks.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Top 5</h3>
      <div className="space-y-2">
        {bookmarks.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              clickMutation.mutate(b.id)
              window.open(b.url, '_blank')
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
          >
            <span className="text-sm truncate flex-1 mr-2">{b.title}</span>
            <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
              <span>{b.click_count} 次</span>
              <ExternalLink size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
