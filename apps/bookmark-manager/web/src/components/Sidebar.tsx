import TopBookmarks from './TopBookmarks'
import SuggestionList from './SuggestionList'
import ImportExport from './ImportExport'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'

export default function Sidebar() {
  return (
    <div className="space-y-6 p-4">
      <TopBookmarks />
      <SuggestionList />
      <ImportExport />
      <Link
        to="/recycle-bin"
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
      >
        <Trash2 size={16} />
        回收站
      </Link>
    </div>
  )
}
