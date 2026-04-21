import { useState } from 'react'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags'
import { X, Edit2, Trash2, Plus } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function TagManager({ onClose }: Props) {
  const { data: tags, isLoading } = useTags()
  const createMutation = useCreateTag()
  const updateMutation = useUpdateTag()
  const deleteMutation = useDeleteTag()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    createMutation.mutate({ name, description: description || undefined }, {
      onSuccess: () => {
        setName('')
        setDescription('')
      },
    })
  }

  const handleUpdate = (id: string) => {
    if (!name.trim()) return
    updateMutation.mutate({ id, input: { name, description: description || undefined } }, {
      onSuccess: () => setEditingId(null),
    })
  }

  const startEdit = (tag: { id: string; name: string; description?: string }) => {
    setEditingId(tag.id)
    setName(tag.name)
    setDescription(tag.description || '')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">标签管理</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="标签名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="描述（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-2">
            {tags?.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                {editingId === tag.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <button
                      onClick={() => handleUpdate(tag.id)}
                      className="text-xs px-2 py-1 rounded bg-green-500 text-white"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-medium">{tag.name}</div>
                      {tag.description && (
                        <div className="text-xs text-gray-500">{tag.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(tag)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(tag.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
