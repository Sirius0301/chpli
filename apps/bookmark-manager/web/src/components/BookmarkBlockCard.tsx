import { useState } from 'react'
import { Bookmark } from '@/types'
import { useDeleteBookmark, useToggleRequired, useClickBookmark } from '@/hooks/useBookmarks'
import { ExternalLink, Star, Edit2, Trash2 } from 'lucide-react'
import BookmarkForm from './BookmarkForm'

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

interface Props {
  bookmark: Bookmark
}

export default function BookmarkBlockCard({ bookmark }: Props) {
  const [editing, setEditing] = useState(false)
  const deleteMutation = useDeleteBookmark()
  const toggleRequired = useToggleRequired()
  const clickMutation = useClickBookmark()
  const color = getStatusColor(bookmark.last_clicked_at)

  const handleClick = () => {
    clickMutation.mutate(bookmark.id)
    window.open(bookmark.url, '_blank')
  }

  if (editing) {
    return (
      <div className="flex-shrink-0 w-36 sm:w-44 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <BookmarkForm
          initialData={bookmark}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-36 sm:w-44 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span
          className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 cursor-pointer hover:text-green-600 dark:hover:text-green-400"
          onClick={handleClick}
          title={bookmark.title}
        >
          {bookmark.title}
        </span>
      </div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate mb-2">{bookmark.url}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleRequired.mutate({ id: bookmark.id, is_required: !bookmark.is_required })}
            className={`p-1 rounded transition-colors ${
              bookmark.is_required
                ? 'text-yellow-500'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={bookmark.is_required ? '取消必点' : '设为必点'}
          >
            <Star size={14} fill={bookmark.is_required ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors"
            title="编辑"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => deleteMutation.mutate(bookmark.id)}
            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <button
          onClick={handleClick}
          className="p-1 rounded text-gray-400 hover:text-green-500 transition-colors"
          title="打开"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  )
}
