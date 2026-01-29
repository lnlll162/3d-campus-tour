import { CampusApp } from './App.js'

// 全局样式
import './styles/main.css'

// 隐藏加载界面并启动应用
const initApp = () => {
  const loading = document.getElementById('loading')
  if (loading) {
    loading.style.display = 'none'
  }

  // 初始化3D校园应用
  const app = new CampusApp()
  app.init()
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
  // 检查WebGL支持
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  if (!gl) {
    alert('您的浏览器不支持WebGL，无法运行3D校园应用。请升级浏览器或启用WebGL支持。')
    return
  }

  initApp()
})

// 开发模式下的调试信息
if (import.meta.env.DEV) {
  console.log('🚀 3D校园应用开发模式启动')
  console.log('📱 浏览器环境检测:', {
    userAgent: navigator.userAgent,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    touchSupport: 'ontouchstart' in window
  })
}
