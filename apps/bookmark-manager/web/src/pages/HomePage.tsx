import { useState, useMemo } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useTags } from '@/hooks/useTags'
import RequiredHeader from '@/components/RequiredHeader'
import TagBlocks from '@/components/TagBlocks'
import { BookmarkBlocks } from '@/components/TagBlocks'
import BookmarkBlockCard from '@/components/BookmarkBlockCard'
import BookmarkForm from '@/components/BookmarkForm'
import TagManager from '@/components/TagManager'
import { Plus, Tag, Search, X } from 'lucide-react'

type ViewMode = 'tags' | 'bookmarks' | 'search'

export default function HomePage() {
  const [showForm, setShowForm] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('tags')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const { data: bookmarks, isLoading: bookmarksLoading } = useBookmarks()
  const { data: tags, isLoading: tagsLoading } = useTags()

  const activeBookmarks = bookmarks?.filter((b) => !b.is_deleted) || []

  const selectedTag = tags?.find((t) => t.id === selectedTagId)

  const tagBookmarks = useMemo(() => {
    if (!selectedTagId) return []
    return activeBookmarks.filter((b) => b.tags.some((t) => t.id === selectedTagId))
  }, [activeBookmarks, selectedTagId])

  const searchResults = useMemo(() => {
    if (!activeSearch) return []
    const q = activeSearch.toLowerCase()
    return activeBookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
    )
  }, [activeBookmarks, activeSearch])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim())
      setViewMode('search')
      setSelectedTagId(null)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setActiveSearch('')
    setViewMode('tags')
    setSelectedTagId(null)
  }

  const handleSelectTag = (tagId: string) => {
    setSelectedTagId(tagId)
    setViewMode('bookmarks')
    setActiveSearch('')
    setSearchQuery('')
  }

  const handleBackToTags = () => {
    setViewMode('tags')
    setSelectedTagId(null)
  }

  const isLoading = bookmarksLoading || tagsLoading

  return (
    <div>
      <RequiredHeader />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">全部书签</h2>
          {/* Search */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="搜索标题或 URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none w-48 sm:w-64"
            />
            <button
              onClick={handleSearch}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="搜索"
            >
              <Search size={16} />
            </button>
            {(activeSearch || searchQuery) && (
              <button
                onClick={handleClearSearch}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="清除"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
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
      ) : viewMode === 'search' ? (
        <div>
          <div className="text-sm text-gray-500 mb-4">
            搜索结果：<span className="font-medium">"{activeSearch}"</span>（{searchResults.length} 个）
          </div>
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400">未找到匹配的书签</div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {searchResults.map((bookmark) => (
                <BookmarkBlockCard key={bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'bookmarks' && selectedTagId ? (
        <BookmarkBlocks
          bookmarks={tagBookmarks}
          onBack={handleBackToTags}
          tagName={selectedTag?.name}
        />
      ) : (
        <TagBlocks
          tags={tags || []}
          bookmarks={activeBookmarks}
          onSelectTag={handleSelectTag}
        />
      )}

      {showTagManager && <TagManager onClose={() => setShowTagManager(false)} />}
    </div>
  )
}
