import axios from 'axios';
import type { Memo, Tag, CreateMemoDTO, UpdateMemoDTO, ApiResponse } from '@chpli/calendar-memo-shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器 - 直接返回 data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ success: false, error: 'NETWORK_ERROR', message: '网络请求失败' });
  }
);

// Memos API
export const memoApi = {
  getAll: (params?: { startDate?: string; endDate?: string; tags?: string[]; priorities?: string[] }) => 
    api.get<any, ApiResponse<Memo[]>>('/memos', { params }),

  getById: (id: string) => 
    api.get<any, ApiResponse<Memo>>(`/memos/${id}`),

  create: (data: CreateMemoDTO) => 
    api.post<any, ApiResponse<Memo>>('/memos', data),

  update: (id: string, data: UpdateMemoDTO) => 
    api.put<any, ApiResponse<Memo>>(`/memos/${id}`, data),

  delete: (id: string) => 
    api.delete<any, ApiResponse<void>>(`/memos/${id}`),

  toggleComplete: (id: string) => 
    api.patch<any, ApiResponse<{ completed: boolean }>>(`/memos/${id}/toggle`),
};

// Tags API
export const tagApi = {
  getAll: () => 
    api.get<any, ApiResponse<Tag[]>>('/tags'),

  create: (data: { name: string; color?: string }) => 
    api.post<any, ApiResponse<Tag>>('/tags', data),

  update: (id: string, data: { name?: string; color?: string }) => 
    api.put<any, ApiResponse<Tag>>(`/tags/${id}`, data),

  delete: (id: string) => 
    api.delete<any, ApiResponse<void>>(`/tags/${id}`),
};

// Upload API
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<any, ApiResponse<{ url: string; filename: string; size: number }>>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
