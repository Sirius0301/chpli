import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { Tag, TagCreateInput, TagUpdateInput } from '@/types'

const fetchTags = async (): Promise<Tag[]> => {
  const { data } = await api.get('/tags/')
  return data
}

export const useTags = () =>
  useQuery({ queryKey: ['tags'], queryFn: fetchTags })

export const useCreateTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TagCreateInput) => api.post('/tags/', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export const useUpdateTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TagUpdateInput }) =>
      api.put(`/tags/${id}/`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export const useDeleteTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}
