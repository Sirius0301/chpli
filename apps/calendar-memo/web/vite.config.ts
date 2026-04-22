import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// 代理目标可通过环境变量配置（用于 Docker 等场景）
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:3001'
const AUTH_API_TARGET = process.env.VITE_AUTH_API_TARGET || 'http://localhost:3002'
const UPLOADS_TARGET = process.env.VITE_UPLOADS_TARGET || 'http://localhost:3001'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@chpli/calendar-memo-shared': resolve(__dirname, '../shared/types'),
    },
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api/auth': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
      },
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/uploads': {
        target: UPLOADS_TARGET,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
