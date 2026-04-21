import { useState, useEffect } from 'react'
import { Bookmark, Tag } from '@/types'
import { useCreateBookmark, useUpdateBookmark } from '@/hooks/useBookmarks'
import { useTags } from '@/hooks/useTags'
import { X } from 'lucide-react'

interface Props {
  initialData?: Bookmark
  onSuccess: () => void
  onCancel: () => void
}

export default function BookmarkForm({ initialData, onSuccess, onCancel }: Props) {
  const [url, setUrl] = useState(initialData?.url || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags.map((t) => t.id) || []
  )
  const [newTagName, setNewTagName] = useState('')

  const createMutation = useCreateBookmark()
  const updateMutation = useUpdateBookmark()
  const { data: tags } = useTags()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { url, title, description: description || undefined, tag_ids: selectedTagIds }
    if (initialData) {
      updateMutation.mutate({ id: initialData.id, input: payload }, { onSuccess })
    } else {
      createMutation.mutate(payload, { onSuccess })
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const addNewTag = () => {
    const name = newTagName.trim()
    if (!name || !tags) return
    const existing = tags.find((t) => t.name === name)
    if (existing && !selectedTagIds.includes(existing.id)) {
      setSelectedTagIds((prev) => [...prev, existing.id])
    }
    setNewTagName('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">标题</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">标签</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags?.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="新标签名称"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
          />
          <button
            type="button"
            onClick={addNewTag}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            添加
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
        >
          {initialData ? '保存' : '创建'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}
