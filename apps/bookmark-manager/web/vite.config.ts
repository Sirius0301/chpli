import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 代理目标可通过环境变量配置（用于 Docker 等场景）
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8001'
const AUTH_API_TARGET = process.env.VITE_AUTH_API_TARGET || 'http://localhost:3002'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api/auth': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
      },
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
