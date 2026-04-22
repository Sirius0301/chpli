import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// 代理目标可通过环境变量配置（用于 Docker 等场景）
const AUTH_API_TARGET = process.env.VITE_AUTH_API_TARGET || 'http://localhost:3002'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/auth': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
