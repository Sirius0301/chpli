import { useQuery } from '@tanstack/react-query'
import { Quote } from 'lucide-react'

interface QuoteData {
  text: string
  author: string
}

const fetchDailyQuote = async (): Promise<QuoteData> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'}/bookmarks/daily-quote`)
  if (!res.ok) {
    throw new Error('Failed to fetch quote')
  }
  return res.json()
}

export default function DailyQuote() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dailyQuote'],
    queryFn: fetchDailyQuote,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="text-xs text-gray-400 italic animate-pulse">
        Loading quote...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Quote size={16} className="text-gray-400 shrink-0" />
        <span className="italic">每日一句加载失败</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
      <Quote size={16} className="text-green-500 shrink-0" />
      <span className="truncate">
        <span className="italic">"{data.text}"</span>
        <span className="text-gray-400 ml-1">— {data.author}</span>
      </span>
    </div>
  )
}
