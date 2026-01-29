/**
 * 信息面板组件
 * 显示建筑信息、导航提示等
 */
export class InfoPanel {
  constructor(container) {
    this.container = container
    this.currentBuilding = null
    this.isVisible = false

    this.createPanel()
    this.setupEventListeners()
  }

  /**
   * 创建信息面板
   */
  createPanel() {
    this.panel = document.createElement('div')
    this.panel.className = 'info-panel'
    this.panel.innerHTML = `
      <div class="info-header">
        <h3 id="building-title">建筑信息</h3>
        <button class="close-btn" id="close-info">×</button>
      </div>
      <div class="info-content">
        <div class="building-image">
          <img id="building-image" src="" alt="建筑图片" style="display: none;">
          <div class="image-placeholder" id="image-placeholder">
            <div class="placeholder-icon">🏢</div>
            <div class="placeholder-text">暂无图片</div>
          </div>
        </div>

        <div class="building-details">
          <div class="detail-item">
            <strong>名称:</strong> <span id="building-name">-</span>
          </div>
          <div class="detail-item">
            <strong>类型:</strong> <span id="building-type">-</span>
          </div>
          <div class="detail-item">
            <strong>位置:</strong> <span id="building-location">-</span>
          </div>
          <div class="detail-item">
            <strong>建筑面积:</strong> <span id="building-area">-</span>
          </div>
          <div class="detail-item">
            <strong>建成时间:</strong> <span id="building-year">-</span>
          </div>
          <div class="detail-item">
            <strong>功能:</strong> <span id="building-function">-</span>
          </div>
        </div>

        <div class="building-description">
          <h4>建筑介绍</h4>
          <p id="building-description">暂无介绍信息</p>
        </div>

        <div class="building-actions">
          <button class="action-btn primary" id="navigate-btn">导航至此</button>
          <button class="action-btn secondary" id="share-btn">分享位置</button>
          <button class="action-btn secondary" id="favorite-btn">收藏</button>
        </div>
      </div>
    `

    this.container.appendChild(this.panel)
    this.hide() // 默认隐藏
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 关闭按钮
    this.panel.querySelector('#close-info').addEventListener('click', () => {
      this.hide()
    })

    // 导航按钮
    this.panel.querySelector('#navigate-btn').addEventListener('click', () => {
      if (this.currentBuilding) {
        this.emit('navigate', this.currentBuilding.id)
      }
    })

    // 分享按钮
    this.panel.querySelector('#share-btn').addEventListener('click', () => {
      if (this.currentBuilding) {
        this.emit('share', this.currentBuilding)
      }
    })

    // 收藏按钮
    const favoriteBtn = this.panel.querySelector('#favorite-btn')
    favoriteBtn.addEventListener('click', () => {
      if (this.currentBuilding) {
        this.currentBuilding.isFavorite = !this.currentBuilding.isFavorite
        this.updateFavoriteButton()
        this.emit('toggleFavorite', this.currentBuilding.id, this.currentBuilding.isFavorite)
      }
    })
  }

  /**
   * 显示建筑信息
   */
  showBuildingInfo(building) {
    this.currentBuilding = building

    // 更新标题
    this.panel.querySelector('#building-title').textContent = building.name || '建筑信息'

    // 更新图片
    const image = this.panel.querySelector('#building-image')
    const placeholder = this.panel.querySelector('#image-placeholder')

    if (building.image) {
      image.src = building.image
      image.style.display = 'block'
      placeholder.style.display = 'none'
    } else {
      image.style.display = 'none'
      placeholder.style.display = 'flex'
    }

    // 更新详细信息
    this.updateBuildingDetails(building)

    // 更新收藏按钮状态
    this.updateFavoriteButton()

    // 显示面板
    this.show()
  }

  /**
   * 更新建筑详细信息
   */
  updateBuildingDetails(building) {
    const details = {
      'building-name': building.name || '-',
      'building-type': building.type || '-',
      'building-location': building.location || '-',
      'building-area': building.area ? `${building.area}㎡` : '-',
      'building-year': building.year || '-',
      'building-function': building.function || '-',
      'building-description': building.description || '暂无介绍信息'
    }

    Object.entries(details).forEach(([id, value]) => {
      const element = this.panel.querySelector(`#${id}`)
      if (element) {
        element.textContent = value
      }
    })
  }

  /**
   * 更新收藏按钮状态
   */
  updateFavoriteButton() {
    const favoriteBtn = this.panel.querySelector('#favorite-btn')
    if (this.currentBuilding && this.currentBuilding.isFavorite) {
      favoriteBtn.textContent = '已收藏'
      favoriteBtn.classList.add('favorited')
    } else {
      favoriteBtn.textContent = '收藏'
      favoriteBtn.classList.remove('favorited')
    }
  }

  /**
   * 显示面板
   */
  show() {
    this.isVisible = true
    this.panel.style.display = 'block'

    // 添加显示动画
    this.panel.style.opacity = '0'
    this.panel.style.transform = 'translateX(100%)'

    requestAnimationFrame(() => {
      this.panel.style.transition = 'all 0.3s ease-out'
      this.panel.style.opacity = '1'
      this.panel.style.transform = 'translateX(0)'
    })
  }

  /**
   * 隐藏面板
   */
  hide() {
    this.isVisible = false

    this.panel.style.transition = 'all 0.3s ease-in'
    this.panel.style.opacity = '0'
    this.panel.style.transform = 'translateX(100%)'

    setTimeout(() => {
      this.panel.style.display = 'none'
    }, 300)
  }

  /**
   * 显示导航提示
   */
  showNavigationHint(building, distance) {
    const hint = document.createElement('div')
    hint.className = 'navigation-hint'
    hint.innerHTML = `
      <div class="hint-content">
        <div class="hint-icon">🎯</div>
        <div class="hint-text">
          <strong>${building.name}</strong><br>
          距离: ${Math.round(distance)}米
        </div>
        <button class="hint-close">×</button>
      </div>
    `

    this.container.appendChild(hint)

    // 自动隐藏
    setTimeout(() => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint)
      }
    }, 5000)

    // 点击关闭
    hint.querySelector('.hint-close').addEventListener('click', () => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint)
      }
    })
  }

  /**
   * 显示欢迎信息
   */
  showWelcomeMessage() {
    const welcome = document.createElement('div')
    welcome.className = 'welcome-message'
    welcome.innerHTML = `
      <div class="welcome-content">
        <h3>欢迎来到3D校园</h3>
        <p>点击建筑查看详细信息，或使用右侧控制面板探索校园</p>
        <button class="welcome-close">知道了</button>
      </div>
    `

    this.container.appendChild(welcome)

    welcome.querySelector('.welcome-close').addEventListener('click', () => {
      if (welcome.parentNode) {
        welcome.parentNode.removeChild(welcome)
      }
    })
  }

  /**
   * 显示加载提示
   */
  showLoadingHint(message = '正在加载建筑信息...') {
    const hint = document.createElement('div')
    hint.className = 'loading-hint'
    hint.innerHTML = `
      <div class="hint-content">
        <div class="spinner"></div>
        <div class="hint-text">${message}</div>
      </div>
    `

    this.container.appendChild(hint)

    // 3秒后自动移除
    setTimeout(() => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint)
      }
    }, 3000)

    return hint
  }

  /**
   * 注册事件回调
   */
  on(event, callback) {
    this.callbacks = this.callbacks || {}
    this.callbacks[event] = callback
  }

  /**
   * 触发事件
   */
  emit(event, ...args) {
    if (this.callbacks && this.callbacks[event]) {
      this.callbacks[event](...args)
    }

    // 发送消息到小程序
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'info_panel_event',
        data: { event, args }
      }, '*')
    }
  }

  /**
   * 获取面板状态
   */
  getState() {
    return {
      isVisible: this.isVisible,
      currentBuilding: this.currentBuilding
    }
  }

  /**
   * 销毁组件
   */
  dispose() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel)
    }

    // 清理所有临时元素
    const hints = this.container.querySelectorAll('.navigation-hint, .welcome-message, .loading-hint')
    hints.forEach(hint => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint)
      }
    })

    this.callbacks = {}
  }
}
