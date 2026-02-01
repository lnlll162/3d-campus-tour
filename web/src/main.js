import { CampusApp } from './App.js'
import { HomePage } from './Home.js'
import { PanoramaPage } from './Panorama.js'
import { mountHomeButton } from './ui/HomeButton.js'

// 全局样式
import './styles/main.css'

const getQuery = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    page: params.get('page') || 'home'
  }
}

const getCurrentPageFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('page') || 'home'
}

const setPage = (page, { replace = false } = {}) => {
  const current = getCurrentPageFromUrl()
  if (!replace && current === page) return

  const url = new URL(window.location.href)
  url.searchParams.set('page', page)

  if (replace) {
    window.history.replaceState({ page }, '', url)
  } else {
    window.history.pushState({ page }, '', url)
  }
}

// 隐藏加载界面
const hideLoading = () => {
  const loading = document.getElementById('loading')
  if (loading) loading.style.display = 'none'
}

const initHome = ({ onEnterCampus, onOpenPanorama }) => {
  const appEl = document.getElementById('app')
  const home = new HomePage({ onEnterCampus, onOpenPanorama })
  home.mount(appEl)
  return home
}

const initCampus = async () => {
  // 检查WebGL支持
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) {
    alert('您的浏览器不支持WebGL，无法运行3D校园应用。请升级浏览器或启用WebGL支持。')
    return null
  }

  const app = new CampusApp()
  await app.init()
  return app
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', async () => {
  hideLoading()

  const appEl = document.getElementById('app')
  let current = null
  let unmountHomeFab = null

  const goto = async (page) => {
    // 清理上一页的悬浮按钮
    if (unmountHomeFab) {
      unmountHomeFab()
      unmountHomeFab = null
    }

    // 清空容器（HomePage 会自己 unmount，CampusApp 目前没有 mount/unmount 概念，直接清空 DOM）
    if (current && current.unmount) current.unmount()
    appEl.innerHTML = ''

    if (page === 'campus') {
      setPage('campus', { replace: false })
      current = await initCampus()
      unmountHomeFab = mountHomeButton({
        onClick: async () => {
          await goto('home')
        }
      })
    } else if (page === 'pano') {
      setPage('pano', { replace: false })
      const pano = new PanoramaPage({
        onBack: async () => {
          await goto('home')
        }
      })
      pano.mount(appEl)
      current = pano
      unmountHomeFab = mountHomeButton({
        onClick: async () => {
          await goto('home')
        }
      })
    } else {
      setPage('home', { replace: false })
      current = initHome({
        onEnterCampus: async () => {
          await goto('campus')
        },
        onOpenPanorama: async () => {
          await goto('pano')
        }
      })
    }
  }

  window.addEventListener('popstate', (e) => {
    const page = e.state?.page || getQuery().page
    goto(page)
  })

  // 首次进入用 replaceState 归一化 URL（避免出现 ?page=home&page=home 这类重复参数）
  setPage(getQuery().page, { replace: true })
  await goto(getQuery().page)
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
