import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { Bookmark, BookmarkCreateInput, BookmarkUpdateInput, SuggestionItem } from '@/types'

const fetchBookmarks = async (tagId?: string): Promise<Bookmark[]> => {
  const { data } = await api.get('/bookmarks/', { params: tagId ? { tag_id: tagId } : {} })
  return data
}

const fetchRequired = async (): Promise<Bookmark[]> => {
  const { data } = await api.get('/bookmarks/required/')
  return data
}

const fetchTop = async (): Promise<Bookmark[]> => {
  const { data } = await api.get('/bookmarks/top/')
  return data
}

const fetchSuggestions = async (): Promise<SuggestionItem[]> => {
  const { data } = await api.get('/bookmarks/suggestions/')
  return data
}

const fetchDeleted = async (): Promise<Bookmark[]> => {
  const { data } = await api.get('/bookmarks/deleted/')
  return data
}

export const useBookmarks = (tagId?: string) =>
  useQuery({ queryKey: ['bookmarks', tagId], queryFn: () => fetchBookmarks(tagId) })

export const useRequiredBookmarks = () =>
  useQuery({ queryKey: ['bookmarks', 'required'], queryFn: fetchRequired })

export const useTopBookmarks = () =>
  useQuery({ queryKey: ['bookmarks', 'top'], queryFn: fetchTop })

export const useSuggestions = () =>
  useQuery({ queryKey: ['bookmarks', 'suggestions'], queryFn: fetchSuggestions })

export const useDeletedBookmarks = () =>
  useQuery({ queryKey: ['bookmarks', 'deleted'], queryFn: fetchDeleted })

export const useCreateBookmark = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BookmarkCreateInput) => api.post('/bookmarks/', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

export const useUpdateBookmark = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BookmarkUpdateInput }) =>
      api.put(`/bookmarks/${id}/`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

export const useDeleteBookmark = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bookmarks/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

export const useRestoreBookmark = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/bookmarks/${id}/restore/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
      qc.invalidateQueries({ queryKey: ['bookmarks', 'deleted'] })
    },
  })
}

export const usePermanentDeleteBookmark = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bookmarks/${id}/permanent/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks', 'deleted'] }),
  })
}

export const useClickBookmark = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/bookmarks/${id}/click/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
      qc.invalidateQueries({ queryKey: ['bookmarks', 'top'] })
      qc.invalidateQueries({ queryKey: ['bookmarks', 'required'] })
    },
  })
}

export const useToggleRequired = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_required }: { id: string; is_required: boolean }) =>
      api.post(`/bookmarks/${id}/required/`, { is_required }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
      qc.invalidateQueries({ queryKey: ['bookmarks', 'required'] })
    },
  })
}

export const useDismissSuggestion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/bookmarks/${id}/dismiss/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks', 'suggestions'] })
    },
  })
}

export const useExportBookmarks = () =>
  useQuery({ queryKey: ['bookmarks', 'export'], queryFn: () => api.get('/bookmarks/export/'), enabled: false })

export const useImportBookmarks = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post('/bookmarks/import/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}
