import { useRef } from 'react'
import { useImportBookmarks, useExportBookmarks } from '@/hooks/useBookmarks'
import { Download, Upload } from 'lucide-react'

export default function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportBookmarks()
  const { refetch: exportData } = useExportBookmarks()

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importMutation.mutate(file)
    e.target.value = ''
  }

  const handleExport = async () => {
    const { data } = await exportData()
    if (!data) return
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Upload size={14} />
        导入
      </button>
      <input ref={fileInputRef} type="file" accept=".json,.html" className="hidden" onChange={handleImport} />
      <button
        onClick={handleExport}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Download size={14} />
        导出
      </button>
    </div>
  )
}
