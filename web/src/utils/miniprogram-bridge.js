/**
 * 小程序通信桥梁
 * 处理H5页面与微信小程序之间的双向通信
 */
export class MiniProgramBridge {
  constructor() {
    this.isMiniProgram = this.detectMiniProgram()
    this.messageHandlers = new Map()
    this.pendingRequests = new Map()
    this.requestId = 0

    if (this.isMiniProgram) {
      this.setupMessageListener()
    }
  }

  /**
   * 检测是否在小程序环境中
   */
  detectMiniProgram() {
    return (
      typeof window !== 'undefined' &&
      window.parent !== window &&
      /miniprogram/i.test(navigator.userAgent)
    )
  }

  /**
   * 设置消息监听器
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      this.handleMessage(event.data)
    })
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    if (!data || typeof data !== 'object') return

    const { type, payload, requestId } = data

    // 处理响应消息
    if (requestId && this.pendingRequests.has(requestId)) {
      const { resolve, reject } = this.pendingRequests.get(requestId)
      this.pendingRequests.delete(requestId)

      if (data.success !== false) {
        resolve(payload)
      } else {
        reject(new Error(payload?.error || 'Request failed'))
      }
      return
    }

    // 处理事件消息
    if (type && this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error('Message handler error:', error)
        }
      })
    }
  }

  /**
   * 发送消息到小程序
   */
  postMessage(type, payload = null, expectResponse = false) {
    if (!this.isMiniProgram) {
      console.warn('Not in miniprogram environment, message not sent:', type, payload)
      return Promise.resolve(null)
    }

    const message = { type, payload }

    if (expectResponse) {
      const requestId = ++this.requestId
      message.requestId = requestId

      return new Promise((resolve, reject) => {
        this.pendingRequests.set(requestId, { resolve, reject })

        // 设置超时
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId)
            reject(new Error('Request timeout'))
          }
        }, 10000) // 10秒超时

        window.parent.postMessage(message, '*')
      })
    } else {
      window.parent.postMessage(message, '*')
      return Promise.resolve(null)
    }
  }

  /**
   * 注册消息处理器
   */
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type).push(handler)
  }

  /**
   * 移除消息处理器
   */
  offMessage(type, handler = null) {
    if (!this.messageHandlers.has(type)) return

    if (handler) {
      const handlers = this.messageHandlers.get(type)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.messageHandlers.delete(type)
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    return this.postMessage('get_user_info', null, true)
  }

  /**
   * 获取地理位置
   */
  async getLocation(options = {}) {
    const payload = {
      type: options.type || 'gcj02',
      altitude: options.altitude || false
    }
    return this.postMessage('get_location', payload, true)
  }

  /**
   * 分享功能
   */
  async share(options = {}) {
    const payload = {
      title: options.title || '3D校园云旅游',
      description: options.description || '探索美丽的校园风景',
      url: options.url || window.location.href,
      imageUrl: options.imageUrl
    }
    return this.postMessage('share', payload, false)
  }

  /**
   * 打开外部链接
   */
  async openUrl(url) {
    return this.postMessage('open_url', { url }, false)
  }

  /**
   * 显示Toast消息
   */
  showToast(message, type = 'info', duration = 2000) {
    return this.postMessage('show_toast', {
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration
    }, false)
  }

  /**
   * 显示加载提示
   */
  showLoading(message = '加载中...') {
    return this.postMessage('show_loading', { message }, false)
  }

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    return this.postMessage('hide_loading', null, false)
  }

  /**
   * 显示模态对话框
   */
  async showModal(options = {}) {
    const payload = {
      title: options.title || '提示',
      content: options.content || '',
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定'
    }
    return this.postMessage('show_modal', payload, true)
  }

  /**
   * 导航到小程序页面
   */
  navigateTo(url) {
    return this.postMessage('navigate_to', { url }, false)
  }

  /**
   * 返回上一页
   */
  navigateBack(delta = 1) {
    return this.postMessage('navigate_back', { delta }, false)
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo() {
    return this.postMessage('get_system_info', null, true)
  }

  /**
   * 获取网络状态
   */
  async getNetworkType() {
    return this.postMessage('get_network_type', null, true)
  }

  /**
   * 振动反馈
   */
  vibrate(type = 'light') {
    return this.postMessage('vibrate', { type }, false) // 'light', 'medium', 'heavy'
  }

  /**
   * 设置剪贴板内容
   */
  setClipboardData(data) {
    return this.postMessage('set_clipboard_data', { data }, false)
  }

  /**
   * 播放背景音乐
   */
  playBackgroundMusic(url) {
    return this.postMessage('play_bgm', { url }, false)
  }

  /**
   * 停止背景音乐
   */
  stopBackgroundMusic() {
    return this.postMessage('stop_bgm', null, false)
  }

  /**
   * 报告性能数据
   */
  reportPerformance(data) {
    return this.postMessage('report_performance', data, false)
  }

  /**
   * 报告用户行为
   */
  reportUserAction(action, data = {}) {
    return this.postMessage('report_user_action', {
      action,
      data,
      timestamp: Date.now(),
      url: window.location.href
    }, false)
  }

  /**
   * 错误上报
   */
  reportError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      context
    }

    return this.postMessage('report_error', errorData, false)
  }

  /**
   * 检查小程序功能支持
   */
  isFeatureSupported(feature) {
    // 常见的小程序功能支持检查
    const supportedFeatures = [
      'getLocation',
      'share',
      'vibrate',
      'clipboard',
      'modal',
      'toast',
      'loading',
      'network',
      'systemInfo'
    ]

    return this.isMiniProgram && supportedFeatures.includes(feature)
  }

  /**
   * 获取桥梁状态
   */
  getBridgeStatus() {
    return {
      isMiniProgram: this.isMiniProgram,
      pendingRequests: this.pendingRequests.size,
      registeredHandlers: Array.from(this.messageHandlers.keys())
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.messageHandlers.clear()
    this.pendingRequests.clear()

    // 清理所有待处理的Promise
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Bridge disposed'))
    }
  }
}
