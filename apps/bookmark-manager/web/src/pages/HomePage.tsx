import { useState } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import RequiredHeader from '@/components/RequiredHeader'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkForm from '@/components/BookmarkForm'
import TagManager from '@/components/TagManager'
import { Plus, Tag } from 'lucide-react'

export default function HomePage() {
  const [showForm, setShowForm] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const { data: bookmarks, isLoading } = useBookmarks()

  const activeBookmarks = bookmarks?.filter((b) => !b.is_deleted) || []

  return (
    <div>
      <RequiredHeader />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          全部书签 <span className="text-sm font-normal text-gray-500">({activeBookmarks.length})</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTagManager(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Tag size={14} />
            标签管理
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
          >
            <Plus size={14} />
            新建书签
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <BookmarkForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : activeBookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>暂无书签</p>
          <p className="text-sm mt-1">点击上方"新建书签"添加第一个书签</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeBookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}

      {showTagManager && <TagManager onClose={() => setShowTagManager(false)} />}
    </div>
  )
}
