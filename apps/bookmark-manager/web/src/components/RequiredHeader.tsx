import { useRequiredBookmarks, useClickBookmark } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import { ExternalLink } from 'lucide-react'

function getStatusColor(lastClickedAt?: string): string {
  if (!lastClickedAt) return 'bg-red-500'
  const last = new Date(lastClickedAt)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  if (last >= todayStart) return 'bg-green-500'
  if (last >= yesterdayStart) return 'bg-yellow-400'
  return 'bg-red-500'
}

function RequiredCard({ bookmark }: { bookmark: Bookmark }) {
  const clickMutation = useClickBookmark()
  const color = getStatusColor(bookmark.last_clicked_at)

  const handleClick = () => {
    clickMutation.mutate(bookmark.id)
    window.open(bookmark.url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-36 sm:w-44 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{bookmark.title}</span>
      </div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{bookmark.url}</div>
      <ExternalLink size={12} className="mt-2 text-gray-400" />
    </button>
  )
}

export default function RequiredHeader() {
  const { data: bookmarks, isLoading } = useRequiredBookmarks()

  if (isLoading) return <div className="text-sm text-gray-400">加载中...</div>
  if (!bookmarks || bookmarks.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">必点书签</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {bookmarks.map((b) => (
          <RequiredCard key={b.id} bookmark={b} />
        ))}
      </div>
    </div>
  )
}
