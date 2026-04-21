import { useDeletedBookmarks, useRestoreBookmark, usePermanentDeleteBookmark } from '@/hooks/useBookmarks'
import { RotateCcw, Trash2 } from 'lucide-react'

export default function RecycleBin() {
  const { data: bookmarks, isLoading } = useDeletedBookmarks()
  const restoreMutation = useRestoreBookmark()
  const permanentDeleteMutation = usePermanentDeleteBookmark()

  if (isLoading) return <div className="text-sm text-gray-400">加载中...</div>

  const deletedBookmarks = bookmarks?.filter((b) => b.is_deleted) || []

  if (deletedBookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Trash2 size={48} className="mb-4 opacity-30" />
        <p>回收站为空</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {deletedBookmarks.map((b) => (
        <div
          key={b.id}
          className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-70"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-medium truncate">{b.title}</h3>
              <p className="text-xs text-gray-500 truncate">{b.url}</p>
              {b.deleted_at && (
                <p className="text-xs text-gray-400 mt-1">
                  删除于 {new Date(b.deleted_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => restoreMutation.mutate(b.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <RotateCcw size={14} />
                恢复
              </button>
              <button
                onClick={() => permanentDeleteMutation.mutate(b.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 size={14} />
                彻底删除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
