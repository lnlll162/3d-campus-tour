import { CampusScene } from './scene/CampusScene.js'
import { PerformanceMonitor } from './utils/PerformanceMonitor.js'
import { ControlPanel } from './ui/ControlPanel.js'
import { InfoPanel } from './ui/InfoPanel.js'
import { LoadingScreen } from './ui/LoadingScreen.js'

export class CampusApp {
  constructor() {
    this.scene = null
    this.performanceMonitor = new PerformanceMonitor()
    this.controlPanel = null
    this.infoPanel = null
    this.loadingScreen = null
    this.isInitialized = false
  }

  async init() {
    try {
      console.log('🚀 初始化3D校园应用...')

      // 初始化性能监控
      this.performanceMonitor.init()

      // 创建UI组件
      this.initUIComponents()

      // 显示加载屏幕
      this.loadingScreen.show('正在初始化3D校园...')

      // 创建3D场景
      this.scene = new CampusScene()
      await this.scene.init()

      // 设置建筑点击回调
      this.scene.onBuildingClick = (buildingData) => {
        this.onBuildingClick(buildingData)
      }

      // 隐藏加载屏幕
      this.loadingScreen.hide()

      // 绑定事件
      this.bindEvents()

      // 启动渲染循环
      this.startRenderLoop()

      this.isInitialized = true
      console.log('✅ 3D校园应用初始化完成')


    } catch (error) {
      console.error('❌ 应用初始化失败:', error)
      this.showError('应用初始化失败，请刷新页面重试')
    }
  }

  bindEvents() {
    // 窗口大小改变
    window.addEventListener('resize', () => {
      if (this.scene) {
        this.scene.onResize()
      }
    })

    // 键盘快捷键（开发模式）
    window.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event)
    })

    // 触摸事件（移动端支持）
    if ('ontouchstart' in window) {
      this.bindTouchEvents()
    }
  }

  bindTouchEvents() {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      let touchStartX = 0
      let touchStartY = 0

      canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0]
        touchStartX = touch.clientX
        touchStartY = touch.clientY
      })

      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        const deltaX = touch.clientX - touchStartX
        const deltaY = touch.clientY - touchStartY

        // 传递触摸移动事件给场景
        if (this.scene) {
          this.scene.onTouchMove(deltaX, deltaY)
        }
      })
    }
  }

  /**
   * 初始化UI组件
   */
  initUIComponents() {
    const app = document.getElementById('app')

    // 控制面板
    this.controlPanel = new ControlPanel(app)
    this.controlPanel.on('resetCamera', () => this.resetCamera())
    this.controlPanel.on('topView', () => this.setTopView())
    this.controlPanel.on('sideView', () => this.setSideView())
    this.controlPanel.on('focusBuilding', (buildingId) => this.focusBuilding(buildingId))
    this.controlPanel.on('setTime', (hour) => this.setTime(hour))
    this.controlPanel.on('toggleDayNightCycle', (enabled) => this.toggleDayNightCycle(enabled))
    this.controlPanel.on('toggleFollowRealTime', (enabled) => this.toggleFollowRealTime(enabled))
    this.controlPanel.on('toggleShadows', (enabled) => this.toggleShadows(enabled))
    this.controlPanel.on('toggleBuildings', (enabled) => this.toggleBuildings(enabled))
    this.controlPanel.on('toggleGround', (enabled) => this.toggleGround(enabled))
    this.controlPanel.on('setViewMode', (mode) => this.setViewMode(mode))

    // 信息面板
    this.infoPanel = new InfoPanel(app)

    // 加载屏幕
    this.loadingScreen = new LoadingScreen(app)
  }

  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate)

      // 更新性能监控
      this.performanceMonitor.update()

      // 渲染场景
      if (this.scene) {
        this.scene.render()
      }

      // 更新UI
      this.updateUI()
    }

    animate()
  }

  /**
   * 初始化UI组件
   */
  initUIComponents() {
    const app = document.getElementById('app')

    // 控制面板
    this.controlPanel = new ControlPanel(app)
    this.controlPanel.on('resetCamera', () => this.resetCamera())
    this.controlPanel.on('topView', () => this.setTopView())
    this.controlPanel.on('sideView', () => this.setSideView())
    this.controlPanel.on('focusBuilding', (buildingId) => this.focusBuilding(buildingId))
    this.controlPanel.on('setTime', (hour) => this.setTime(hour))
    this.controlPanel.on('toggleDayNightCycle', (enabled) => this.toggleDayNightCycle(enabled))
    this.controlPanel.on('toggleFollowRealTime', (enabled) => this.toggleFollowRealTime(enabled))
    this.controlPanel.on('toggleShadows', (enabled) => this.toggleShadows(enabled))
    this.controlPanel.on('toggleBuildings', (enabled) => this.toggleBuildings(enabled))
    this.controlPanel.on('toggleGround', (enabled) => this.toggleGround(enabled))
    this.controlPanel.on('setViewMode', (mode) => this.setViewMode(mode))

    // 信息面板
    this.infoPanel = new InfoPanel(app)

    // 加载屏幕
    this.loadingScreen = new LoadingScreen(app)
  }

  /**
   * 更新UI组件
   */
  updateUI() {
    if (this.controlPanel) {
      // 更新FPS显示
      this.controlPanel.updateFPS(this.performanceMonitor.fps)

      // 更新内存显示
      const memoryMB = this.performanceMonitor.memory ?
        this.performanceMonitor.memory.used : 0
      this.controlPanel.updateMemory(memoryMB)

      // 更新模型数量
      const modelCount = this.scene ? this.scene.buildings.size : 0
      this.controlPanel.updateModelCount(modelCount)

      // 同步时间显示/滑块（昼夜循环开启时更直观）
      if (this.scene && this.scene.getTimeOfDay && this.scene.dayNightCycleEnabled) {
        this.controlPanel.setTime(this.scene.getTimeOfDay())
      }

      // 同步开关状态
      if (this.scene) {
        if (this.controlPanel.setDayNightCycleEnabled) {
          this.controlPanel.setDayNightCycleEnabled(!!this.scene.dayNightCycleEnabled)
        }
        if (this.controlPanel.setFollowRealTimeEnabled) {
          this.controlPanel.setFollowRealTimeEnabled(!!this.scene.followRealTimeEnabled)
        }
      }
    }
  }

  /**
   * 建筑点击处理
   */
  onBuildingClick(buildingData) {
    console.log('🏗️ 建筑被点击:', buildingData)

    // 根据建筑ID获取详细信息
    const buildingDetails = this.getBuildingDetails(buildingData.id)

    // 显示建筑信息
    if (this.infoPanel && buildingDetails) {
      this.infoPanel.showBuildingInfo(buildingDetails)
    }

    // 聚焦到建筑
    if (this.scene) {
      this.scene.navigateToBuilding(buildingData.id)
    }
  }

  /**
   * 获取建筑详细信息
   */
  getBuildingDetails(buildingId) {
    const buildingData = {
      library: {
        id: 'library',
        name: '学校Logo',
        type: '标志性建筑',
        description: '学校标志性建筑，代表学校形象和文化传承。Logo模型展示了学校的品牌标识和视觉形象。',
        image: '/models/logo-preview.jpg', // 如果有预览图
        position: [0, 0, 0]
      },
      dormitory: {
        id: 'dormitory',
        name: '宿舍楼',
        type: '生活设施',
        description: '学生宿舍楼，提供舒适的住宿环境和生活设施。配备现代化宿舍条件，支持学生学习和生活。',
        position: [15, 0, 0]
      },
      classroom: {
        id: 'classroom',
        name: '教学楼',
        type: '教学设施',
        description: '现代化教学楼，配备先进的教学设备和设施。提供优质的教学环境，支持多种教学模式。',
        position: [-15, 0, 0]
      }
    }

    return buildingData[buildingId] || {
      id: buildingId,
      name: buildingData[buildingId]?.name || '未知建筑',
      type: '校园建筑',
      description: '校园内的重要建筑设施。',
      position: [0, 0, 0]
    }
  }

  /**
   * 重置相机
   */
  resetCamera() {
    if (this.scene) {
      this.scene.resetCamera()
    }
    console.log('📷 相机已重置')
  }

  /**
   * 设置俯视角度
   */
  setTopView() {
    if (this.scene && this.scene.camera && this.scene.controls) {
      this.scene.camera.position.set(0, 50, 0)
      this.scene.controls.target.set(0, 0, 0)
      this.scene.controls.update()
      console.log('👁️ 已切换到俯视角度')
    }
  }

  /**
   * 设置侧视角度
   */
  setSideView() {
    if (this.scene && this.scene.camera && this.scene.controls) {
      this.scene.camera.position.set(30, 15, 30)
      this.scene.controls.target.set(0, 0, 0)
      this.scene.controls.update()
      console.log('👁️ 已切换到侧视角度')
    }
  }

  /**
   * 聚焦到建筑
   */
  focusBuilding(buildingId) {
    if (this.scene) {
      this.scene.navigateToBuilding(buildingId)
      console.log(`🎯 已聚焦到建筑: ${buildingId}`)
    }
  }

  /**
   * 设置时间（昼夜循环）
   */
  setTime(hour) {
    if (this.scene && this.scene.setTimeOfDay) {
      this.scene.setTimeOfDay(hour)
    }
    console.log(`🕐 时间设置为: ${hour}:00`)
  }

  /**
   * 切换昼夜循环
   */
  toggleDayNightCycle(enabled) {
    if (this.scene && this.scene.setDayNightCycleEnabled) {
      this.scene.setDayNightCycleEnabled(enabled)
    }
    console.log(`🌅 昼夜循环: ${enabled ? '开启' : '关闭'}`)
  }

  toggleFollowRealTime(enabled) {
    if (this.scene && this.scene.setFollowRealTimeEnabled) {
      this.scene.setFollowRealTimeEnabled(enabled)
    }
    console.log(`🕒 跟随系统时间: ${enabled ? '开启' : '关闭'}`)
  }

  /**
   * 切换阴影
   */
  toggleShadows(enabled) {
    if (this.scene) {
      this.scene.lights.forEach(light => {
        if (light.isDirectionalLight) {
          light.castShadow = enabled
        }
      })
      console.log(`🌑 阴影: ${enabled ? '开启' : '关闭'}`)
    }
  }

  /**
   * 切换建筑显示
   */
  toggleBuildings(enabled) {
    if (this.scene) {
      this.scene.buildings.forEach(building => {
        building.visible = enabled
      })
      console.log(`🏗️ 建筑显示: ${enabled ? '开启' : '关闭'}`)
    }
  }

  /**
   * 切换地面显示
   */
  toggleGround(enabled) {
    if (this.scene) {
      // 查找地面对象（通常是第一个非建筑对象）
      this.scene.scene.children.forEach(child => {
        if (child.userData.type !== 'building' && child.isMesh) {
          child.visible = enabled
        }
      })
      console.log(`🌱 地面显示: ${enabled ? '开启' : '关闭'}`)
    }
  }

  /**
   * 设置视角模式
   */
  setViewMode(mode) {
    console.log('CampusApp: setViewMode called', mode)
    if (this.scene) {
      this.scene.setViewMode(mode)
      console.log(`🕹️ 视角模式切换为: ${mode}`)
    }
  }

  handleKeyboardShortcuts(event) {
    // 开发模式下的键盘快捷键
    if (import.meta.env.DEV) {
      switch (event.key.toLowerCase()) {
        case 'r':
          // 重置相机
          this.resetCamera()
          break
        case 'f':
          // 全屏模式
          this.toggleFullscreen()
          break
        case 'p':
          // 性能面板
          this.togglePerformancePanel()
          break
        case 'h':
          // 帮助信息
          this.showHelp()
          break
      }
    }
  }

  resetCamera() {
    if (this.scene) {
      this.scene.resetCamera()
    }
    console.log('📷 相机已重置')
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('无法进入全屏模式:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  togglePerformancePanel() {
    this.performanceMonitor.toggle()
  }

  showWelcomeMessage() {
    const welcome = document.createElement('div')
    welcome.className = 'welcome-banner'
    welcome.innerHTML = `
      <div class="welcome-content">
        <h2>🎓 欢迎来到3D校园</h2>
        <p>使用鼠标拖拽旋转视角，滚轮缩放，点击建筑查看信息</p>
        <div class="controls-hint">
          <span><kbd>R</kbd> 重置视角</span>
          <span><kbd>F</kbd> 全屏</span>
          <span><kbd>P</kbd> 性能面板</span>
          <span><kbd>H</kbd> 帮助</span>
        </div>
        <button class="close-welcome">开始探索</button>
      </div>
    `

    document.body.appendChild(welcome)

    welcome.querySelector('.close-welcome').addEventListener('click', () => {
      welcome.remove()
    })

    // 3秒后自动隐藏
    setTimeout(() => {
      if (welcome.parentNode) {
        welcome.remove()
      }
    }, 8000)
  }

  showHelp() {
    const help = document.createElement('div')
    help.className = 'help-overlay'
    help.innerHTML = `
      <div class="help-content">
        <h3>🖱️ 操作指南</h3>
        <ul>
          <li><strong>鼠标拖拽:</strong> 旋转视角</li>
          <li><strong>滚轮:</strong> 缩放视图</li>
          <li><strong>右键拖拽:</strong> 平移视图</li>
          <li><strong>双击建筑:</strong> 聚焦建筑</li>
        </ul>
        <h3>⌨️ 快捷键</h3>
        <ul>
          <li><kbd>R</kbd> - 重置相机视角</li>
          <li><kbd>F</kbd> - 切换全屏</li>
          <li><kbd>P</kbd> - 显示/隐藏性能面板</li>
          <li><kbd>H</kbd> - 显示此帮助</li>
        </ul>
        <button class="close-help">知道了</button>
      </div>
    `

    document.body.appendChild(help)

    help.querySelector('.close-help').addEventListener('click', () => {
      help.remove()
    })

    // 点击遮罩关闭
    help.addEventListener('click', (e) => {
      if (e.target === help) {
        help.remove()
      }
    })
  }

  showError(message) {
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      z-index: 10000;
      max-width: 300px;
    `
    errorDiv.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 10px;">⚠️ 错误</div>
      <div>${message}</div>
    `
    document.body.appendChild(errorDiv)

    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  }

  dispose() {
    if (this.scene) {
      this.scene.dispose()
    }
    this.performanceMonitor.dispose()
  }
}
