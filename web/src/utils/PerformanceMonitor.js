export class PerformanceMonitor {
  constructor() {
    this.fps = 0
    this.frameCount = 0
    this.lastTime = performance.now()
    this.memory = null
    this.isVisible = false
    this.panel = null
  }

  init() {
    // 连接到HTML中的性能面板
    this.connectToHTMLPanel()

    // 如果是开发模式，默认显示性能面板
    if (this.isDevelopment()) {
      this.showPanel()
    }

    console.log('📊 性能监控已启动')
  }

  isDevelopment() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  }

  connectToHTMLPanel() {
    // 连接到HTML中已有的性能面板
    this.panel = document.getElementById('performance-panel')
    if (this.panel) {
      this.fpsElement = document.getElementById('fps-display')
      this.frameTimeElement = document.getElementById('frame-time')
      this.memoryElement = document.getElementById('memory-display')
      this.geometriesElement = document.getElementById('geometries-count')
      this.texturesElement = document.getElementById('textures-count')
    }
  }

  showPanel() {
    if (this.panel) {
      this.panel.style.display = 'block'
      this.isVisible = true
    }
  }

  hidePanel() {
    if (this.panel) {
      this.panel.style.display = 'none'
      this.isVisible = false
    }
  }

  update() {
    this.frameCount++
    const now = performance.now()

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime))
      this.frameCount = 0
      this.lastTime = now

      // 更新内存信息
      if (performance.memory) {
        this.memory = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        }
      }

      // 更新面板显示
      this.updatePanel(window.renderer)

      // 性能告警
      this.checkPerformance()
    }
  }

  updatePanel(renderer = null) {
    if (!this.panel || !this.isVisible) return

    // 更新FPS
    if (this.fpsElement) {
      this.fpsElement.textContent = this.fps
    }

    // 更新帧时间（估算）
    if (this.frameTimeElement) {
      const frameTime = this.fps > 0 ? Math.round(1000 / this.fps) : '--'
      this.frameTimeElement.textContent = frameTime
    }

    // 更新内存信息
    if (this.memoryElement && this.memory) {
      this.memoryElement.textContent = `${this.memory.used}MB`
    }

    // 更新几何体数量
    if (this.geometriesElement && renderer) {
      this.geometriesElement.textContent = renderer.info.memory.geometries
    }

    // 更新纹理数量
    if (this.texturesElement && renderer) {
      this.texturesElement.textContent = renderer.info.memory.textures
    }
  }

  checkPerformance() {
    // FPS告警
    if (this.fps < 30) {
      console.warn(`⚠️ FPS过低: ${this.fps}`)
      this.showWarning('FPS过低，可能影响体验')
    }

    // 内存告警
    if (this.memory && this.memory.used > this.memory.limit * 0.8) {
      console.warn(`⚠️ 内存使用过高: ${this.memory.used}MB`)
      this.showWarning('内存使用过高，建议刷新页面')
    }
  }

  showWarning(message) {
    // 避免重复显示
    if (document.querySelector('.performance-warning')) return

    const warning = document.createElement('div')
    warning.className = 'performance-warning error-toast'
    warning.textContent = `⚠️ ${message}`
    document.body.appendChild(warning)

    setTimeout(() => {
      warning.remove()
    }, 3000)
  }

  toggle() {
    if (!this.panel) return

    this.isVisible = !this.isVisible
    this.panel.style.display = this.isVisible ? 'block' : 'none'
  }

  getStats() {
    return {
      fps: this.fps,
      memory: this.memory,
      timestamp: Date.now()
    }
  }

  dispose() {
    if (this.panel) {
      this.panel.remove()
      this.panel = null
    }
  }
}
