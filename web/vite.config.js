import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    host: true,
    port: 5173,
    open: true,
    // 临时解决方案：禁用某些可能导致问题的功能
    fs: {
      strict: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@models': resolve(__dirname, './models'),
      '@utils': resolve(__dirname, './src/utils')
    }
  },
  // 临时解决方案：简化配置
  optimizeDeps: {
    exclude: []
  }
})
