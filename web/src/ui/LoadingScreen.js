/**
 * 加载屏幕组件
 * 提供应用启动和场景切换时的加载界面
 */
export class LoadingScreen {
  constructor(container) {
    this.container = container
    this.isVisible = false
    this.currentProgress = 0
    this.loadingSteps = []

    this.createLoadingScreen()
  }

  /**
   * 创建加载屏幕
   */
  createLoadingScreen() {
    this.screen = document.createElement('div')
    this.screen.className = 'loading-screen'
    this.screen.innerHTML = `
      <div class="loading-container">
        <div class="loading-logo">
          <div class="logo-icon">🏫</div>
          <h1>3D校园云旅游</h1>
        </div>

        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text" id="progress-text">正在初始化...</div>
          <div class="progress-percent" id="progress-percent">0%</div>
        </div>

        <div class="loading-steps" id="loading-steps">
          <!-- 动态添加加载步骤 -->
        </div>

        <div class="loading-tips">
          <div class="tip-icon">💡</div>
          <div class="tip-text" id="loading-tip">首次加载可能需要一些时间，请耐心等待</div>
        </div>
      </div>
    `

    this.container.appendChild(this.screen)
  }

  /**
   * 显示加载屏幕
   */
  show(title = '3D校园云旅游', subtitle = '正在加载...') {
    this.isVisible = true
    this.currentProgress = 0
    this.loadingSteps = []

    // 更新标题
    const titleElement = this.screen.querySelector('h1')
    if (titleElement) {
      titleElement.textContent = title
    }

    // 重置进度
    this.updateProgress(0, subtitle)

    // 清空步骤列表
    const stepsContainer = this.screen.querySelector('#loading-steps')
    stepsContainer.innerHTML = ''

    // 显示屏幕
    this.screen.style.display = 'flex'
    this.screen.style.opacity = '1'

    // 随机显示提示信息
    this.showRandomTip()
  }

  /**
   * 隐藏加载屏幕
   */
  hide() {
    this.isVisible = false

    this.screen.style.transition = 'opacity 0.5s ease-out'
    this.screen.style.opacity = '0'

    setTimeout(() => {
      this.screen.style.display = 'none'
    }, 500)
  }

  /**
   * 更新加载进度
   */
  updateProgress(progress, text = null) {
    this.currentProgress = Math.max(0, Math.min(100, progress))

    // 更新进度条
    const progressFill = this.screen.querySelector('#progress-fill')
    const progressPercent = this.screen.querySelector('#progress-percent')
    const progressText = this.screen.querySelector('#progress-text')

    if (progressFill) {
      progressFill.style.width = `${this.currentProgress}%`
    }

    if (progressPercent) {
      progressPercent.textContent = `${Math.round(this.currentProgress)}%`
    }

    if (text && progressText) {
      progressText.textContent = text
    }

    // 根据进度调整提示
    if (this.currentProgress >= 100) {
      if (progressText) {
        progressText.textContent = '加载完成！'
      }
    }
  }

  /**
   * 添加加载步骤
   */
  addLoadingStep(stepName, weight = 1) {
    const step = {
      name: stepName,
      weight: weight,
      completed: false,
      element: null
    }

    this.loadingSteps.push(step)

    // 创建步骤元素
    const stepsContainer = this.screen.querySelector('#loading-steps')
    if (stepsContainer) {
      const stepElement = document.createElement('div')
      stepElement.className = 'loading-step'
      stepElement.innerHTML = `
        <div class="step-indicator">○</div>
        <div class="step-name">${stepName}</div>
        <div class="step-status">等待中</div>
      `

      stepsContainer.appendChild(stepElement)
      step.element = stepElement
    }

    return step
  }

  /**
   * 完成加载步骤
   */
  completeLoadingStep(stepName) {
    const step = this.loadingSteps.find(s => s.name === stepName)
    if (step && !step.completed) {
      step.completed = true

      if (step.element) {
        const indicator = step.element.querySelector('.step-indicator')
        const status = step.element.querySelector('.step-status')

        if (indicator) indicator.textContent = '✓'
        if (status) status.textContent = '完成'
        step.element.classList.add('completed')
      }

      // 自动计算总进度
      this.calculateAutoProgress()
    }
  }

  /**
   * 自动计算进度
   */
  calculateAutoProgress() {
    const totalWeight = this.loadingSteps.reduce((sum, step) => sum + step.weight, 0)
    const completedWeight = this.loadingSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.weight, 0)

    const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0
    this.updateProgress(progress)
  }

  /**
   * 显示随机提示信息
   */
  showRandomTip() {
    const tips = [
      '首次加载可能需要一些时间，请耐心等待',
      '正在初始化3D渲染引擎...',
      '正在加载校园建筑模型...',
      '正在配置光照和材质...',
      '正在优化渲染性能...',
      '即将进入精彩的3D校园世界！'
    ]

    const tipElement = this.screen.querySelector('#loading-tip')
    if (tipElement) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)]
      tipElement.textContent = randomTip
    }
  }

  /**
   * 设置自定义提示
   */
  setTip(tip) {
    const tipElement = this.screen.querySelector('#loading-tip')
    if (tipElement) {
      tipElement.textContent = tip
    }
  }

  /**
   * 显示错误状态
   */
  showError(errorMessage, retryCallback = null) {
    const progressText = this.screen.querySelector('#progress-text')
    const tipElement = this.screen.querySelector('#loading-tip')

    if (progressText) {
      progressText.textContent = '加载失败'
      progressText.style.color = '#ff6b6b'
    }

    if (tipElement) {
      tipElement.innerHTML = `
        <div style="color: #ff6b6b;">${errorMessage}</div>
        ${retryCallback ? '<button class="retry-btn" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">重试</button>' : ''}
      `

      if (retryCallback) {
        const retryBtn = tipElement.querySelector('.retry-btn')
        retryBtn.addEventListener('click', () => {
          retryCallback()
          this.showRandomTip()
          if (progressText) {
            progressText.style.color = ''
          }
        })
      }
    }
  }

  /**
   * 重置加载屏幕
   */
  reset() {
    this.currentProgress = 0
    this.loadingSteps = []

    const stepsContainer = this.screen.querySelector('#loading-steps')
    if (stepsContainer) {
      stepsContainer.innerHTML = ''
    }

    this.updateProgress(0, '正在初始化...')
    this.showRandomTip()
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      isVisible: this.isVisible,
      progress: this.currentProgress,
      steps: this.loadingSteps.map(step => ({
        name: step.name,
        completed: step.completed,
        weight: step.weight
      }))
    }
  }

  /**
   * 销毁组件
   */
  dispose() {
    if (this.screen && this.screen.parentNode) {
      this.screen.parentNode.removeChild(this.screen)
    }
  }
}
