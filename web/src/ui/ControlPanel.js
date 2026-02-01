/**
 * 控制面板组件
 * 提供相机控制、建筑选择等UI控制
 */
export class ControlPanel {
  constructor(container) {
    this.container = container
    this.isVisible = false
    this.callbacks = {}

    this.createPanel()

    if (this.isVisible) {
      this.panel.classList.add('is-expanded')
    } else {
      this.panel.classList.remove('is-expanded')
      const toggleBtn = this.panel.querySelector('#toggle-panel')
      if (toggleBtn) toggleBtn.textContent = '展开'
    }

    this.setupEventListeners()
  }

  /**
   * 创建控制面板
   */
  createPanel() {
    this.panel = document.createElement('div')
    this.panel.className = 'control-panel'
    this.panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">控制面板</div>
        <button class="toggle-btn" id="toggle-panel" aria-label="展开/折叠">展开</button>
      </div>
      <div class="panel-body">
        <div class="panel-content">
          <div class="control-group">
            <label>视角模式</label>
            <select id="view-mode" class="building-select">
            <option value="orbit">Orbit（环绕）</option>
            <option value="fpv">第一人称</option>
            <option value="tpv">第三人称</option>
          </select>
        </div>

        <div class="control-group">
          <label>相机控制</label>
          <div class="button-group">
            <button id="reset-camera" class="control-btn">重置<br>视角</button>
            <button id="top-view" class="control-btn control-btn-secondary">俯视</button>
            <button id="side-view" class="control-btn control-btn-secondary">侧视</button>
          </div>
        </div>


        <div class="control-group">
          <label>光照控制</label>
          <div class="slider-group">
            <label>时间: <span id="time-value">12:00</span></label>
            <input type="range" id="time-slider" min="0" max="23" value="12" step="1">
          </div>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" id="day-night-cycle">
              昼夜循环
            </label>
            <label>
              <input type="checkbox" id="follow-real-time">
              跟随系统时间
            </label>
          </div>
        </div>

        <div class="control-group">
          <label>显示选项</label>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" id="show-shadows" checked>
              显示阴影
            </label>
            <label>
              <input type="checkbox" id="show-buildings" checked>
              显示建筑
            </label>
            <label>
              <input type="checkbox" id="show-ground" checked>
              显示地面
            </label>
          </div>
        </div>
        </div>

        <div class="panel-info">
          <label>信息</label>
          <div class="info-display">
            <div>FPS:</div><div><span id="fps-display">60</span></div>
            <div>内存:</div><div><span id="memory-display">50MB</span></div>
            <div>模型:</div><div><span id="model-count">0</span></div>
          </div>
        </div>
      </div>
    `

    this.container.appendChild(this.panel)
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 面板切换
    const toggleBtn = this.panel.querySelector('#toggle-panel')
    toggleBtn.addEventListener('click', () => {
      this.togglePanel()
    })

    // 相机控制
    this.panel.querySelector('#reset-camera').addEventListener('click', () => {
      this.emit('resetCamera')
    })

    this.panel.querySelector('#top-view').addEventListener('click', () => {
      this.emit('topView')
    })

    this.panel.querySelector('#side-view').addEventListener('click', () => {
      this.emit('sideView')
    })

    // 视角模式
    this.panel.querySelector('#view-mode').addEventListener('change', (e) => {
      console.log('ControlPanel: setViewMode emitted', e.target.value)
      this.emit('setViewMode', e.target.value)
    })


    // 光照控制
    const timeSlider = this.panel.querySelector('#time-slider')
    timeSlider.addEventListener('input', (e) => {
      const hour = parseInt(e.target.value)
      this.updateTimeDisplay(hour)
      this.emit('setTime', hour)

      // 手动设置时间时，自动退出“跟随系统时间”
      const followRealTime = this.panel.querySelector('#follow-real-time')
      if (followRealTime && followRealTime.checked) {
        followRealTime.checked = false
        this.emit('toggleFollowRealTime', false)
      }
    })

    const dayNightCycle = this.panel.querySelector('#day-night-cycle')
    dayNightCycle.addEventListener('change', (e) => {
      this.emit('toggleDayNightCycle', e.target.checked)

      // 关闭昼夜循环时，也同步关闭“跟随系统时间”
      if (!e.target.checked) {
        const followRealTime = this.panel.querySelector('#follow-real-time')
        if (followRealTime && followRealTime.checked) {
          followRealTime.checked = false
          this.emit('toggleFollowRealTime', false)
        }
      }
    })

    const followRealTime = this.panel.querySelector('#follow-real-time')
    followRealTime.addEventListener('change', (e) => {
      // 未开启昼夜循环时，不允许单独开启跟随系统时间
      const cycle = this.panel.querySelector('#day-night-cycle')
      if (e.target.checked && cycle && !cycle.checked) {
        if (cycle) cycle.checked = true
        this.emit('toggleDayNightCycle', true)
      }

      this.emit('toggleFollowRealTime', e.target.checked)
    })

    // 显示选项
    const showShadows = this.panel.querySelector('#show-shadows')
    showShadows.addEventListener('change', (e) => {
      this.emit('toggleShadows', e.target.checked)
    })

    const showBuildings = this.panel.querySelector('#show-buildings')
    showBuildings.addEventListener('change', (e) => {
      this.emit('toggleBuildings', e.target.checked)
    })

    const showGround = this.panel.querySelector('#show-ground')
    showGround.addEventListener('change', (e) => {
      this.emit('toggleGround', e.target.checked)
    })
  }

  /**
   * 切换面板显示/隐藏
   */
  togglePanel() {
    this.isVisible = !this.isVisible

    if (this.isVisible) {
      this.panel.classList.add('is-expanded')
    } else {
      this.panel.classList.remove('is-expanded')
    }

    const toggleBtn = this.panel.querySelector('#toggle-panel')
    if (toggleBtn) {
      toggleBtn.textContent = this.isVisible ? '折叠' : '展开'
    }
  }

  /**
   * 更新时间显示
   */
  updateTimeDisplay(hour) {
    const timeValue = this.panel.querySelector('#time-value')

    // 允许小数小时：例如 13.5 -> 13:30
    const h = Number(hour)
    if (!Number.isFinite(h)) return

    const totalMinutes = ((h % 24) + 24) % 24 * 60
    const hh24 = Math.floor(totalMinutes / 60) % 24
    const mm = Math.round(totalMinutes % 60)

    const hour12 = hh24 === 0 ? 12 : hh24 > 12 ? hh24 - 12 : hh24
    const ampm = hh24 < 12 ? 'AM' : 'PM'
    const mmStr = String(mm).padStart(2, '0')

    timeValue.textContent = `${hour12}:${mmStr} ${ampm}`
  }

  setTime(hour) {
    const slider = this.panel.querySelector('#time-slider')
    if (slider) slider.value = String(Math.round(Number(hour) || 0))
    this.updateTimeDisplay(hour)
  }

  setDayNightCycleEnabled(enabled) {
    const cb = this.panel.querySelector('#day-night-cycle')
    if (cb) cb.checked = !!enabled
  }

  setFollowRealTimeEnabled(enabled) {
    const cb = this.panel.querySelector('#follow-real-time')
    if (cb) cb.checked = !!enabled
  }

  /**
   * 更新FPS显示
   */
  updateFPS(fps) {
    const fpsDisplay = this.panel.querySelector('#fps-display')
    fpsDisplay.textContent = Math.round(fps)
  }

  /**
   * 更新内存显示
   */
  updateMemory(memoryMB) {
    const memoryDisplay = this.panel.querySelector('#memory-display')
    memoryDisplay.textContent = `${Math.round(memoryMB)}MB`
  }

  /**
   * 更新模型数量
   */
  updateModelCount(count) {
    const modelCount = this.panel.querySelector('#model-count')
    modelCount.textContent = count
  }

  /**
   * 设置建筑列表
   */

  /**
   * 注册事件回调
   */
  on(event, callback) {
    this.callbacks[event] = callback
  }

  /**
   * 触发事件
   */
  emit(event, ...args) {
    if (this.callbacks[event]) {
      this.callbacks[event](...args)
    }

    // 同时发送消息到小程序
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'ui_event',
        data: { event, args }
      }, '*')
    }
  }

  /**
   * 显示加载进度
   */
  showLoading(message = '加载中...') {
    if (!this.loadingOverlay) {
      this.loadingOverlay = document.createElement('div')
      this.loadingOverlay.className = 'loading-overlay'
      this.loadingOverlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">${message}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
        </div>
      `
      this.container.appendChild(this.loadingOverlay)
    } else {
      this.loadingOverlay.querySelector('.loading-text').textContent = message
      this.loadingOverlay.style.display = 'flex'
    }
  }

  /**
   * 隐藏加载进度
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none'
    }
  }

  /**
   * 更新加载进度
   */
  updateProgress(progress) {
    if (this.loadingOverlay) {
      const progressFill = this.loadingOverlay.querySelector('.progress-fill')
      progressFill.style.width = `${progress * 100}%`
    }
  }

  /**
   * 显示错误信息
   */
  showError(message, duration = 5000) {
    const errorToast = document.createElement('div')
    errorToast.className = 'error-toast'
    errorToast.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
      <button class="error-close">×</button>
    `

    this.container.appendChild(errorToast)

    // 自动隐藏
    setTimeout(() => {
      if (errorToast.parentNode) {
        errorToast.parentNode.removeChild(errorToast)
      }
    }, duration)

    // 点击关闭
    errorToast.querySelector('.error-close').addEventListener('click', () => {
      if (errorToast.parentNode) {
        errorToast.parentNode.removeChild(errorToast)
      }
    })
  }

  /**
   * 显示成功信息
   */
  showSuccess(message, duration = 3000) {
    const successToast = document.createElement('div')
    successToast.className = 'success-toast'
    successToast.innerHTML = `
      <div class="success-icon">✅</div>
      <div class="success-message">${message}</div>
    `

    this.container.appendChild(successToast)

    setTimeout(() => {
      if (successToast.parentNode) {
        successToast.parentNode.removeChild(successToast)
      }
    }, duration)
  }

  /**
   * 销毁组件
   */
  dispose() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel)
    }

    if (this.loadingOverlay && this.loadingOverlay.parentNode) {
      this.loadingOverlay.parentNode.removeChild(this.loadingOverlay)
    }

    this.callbacks = {}
  }
}
