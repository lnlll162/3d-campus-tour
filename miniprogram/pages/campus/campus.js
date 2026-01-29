// 3D校园页面 - H5-first架构，小程序作为web-view容器

const { getH5Url, isFeatureEnabled } = require('../../config/config.js')

Page({
  data: {
    // web-view配置
    webviewSrc: '', // H5页面URL，会在onLoad中设置
    canUseWebView: true, // 是否支持web-view

    // 加载状态
    showLoading: true,
    loadingText: '正在启动3D校园...',

    // 权限状态
    hasLocationPermission: false
  },

  onLoad(options) {
    console.log('🏫 校园页面加载', options)

    // 检查web-view支持
    this.checkWebViewSupport()

    // 设置H5页面URL
    this.setWebViewSrc()

    // 检查权限
    this.checkPermissions()
  },

  onShow() {
    console.log('🏫 校园页面显示')
  },

  onHide() {
    console.log('🏫 校园页面隐藏')
  },

  onUnload() {
    console.log('🏫 校园页面卸载')
    this.cleanup()
  },

  /**
   * 检查web-view支持
   */
  checkWebViewSupport() {
    // 微信版本检查
    const accountInfo = wx.getAccountInfoSync()
    const version = accountInfo.miniProgram.version || '0.0.0'
    console.log('📱 小程序版本:', version)

    // 检查是否支持web-view的基本功能
    // web-view在基础库2.5.0+开始支持，大部分功能在2.7.0+完善
    const systemInfo = wx.getSystemInfoSync()
    const sdkVersion = systemInfo.SDKVersion || '0.0.0'
    console.log('📱 基础库版本:', sdkVersion)

    // 简单检查，如果版本太低给出提示
    if (this.compareVersion(sdkVersion, '2.5.0') < 0) {
      wx.showModal({
        title: '版本过低',
        content: '您的微信版本过低，请升级到最新版本以获得最佳体验',
        showCancel: false
      })
    }

    this.setData({
      canUseWebView: true
    })
  },

  /**
   * 设置web-view的H5页面URL
   */
  setWebViewSrc() {
    // 使用配置文件获取H5页面URL（配置会优先读取 localDevHost 覆盖）
    const h5Url = getH5Url()
    console.log('🌐 H5页面URL:', h5Url)
    this.setData({
      webviewSrc: h5Url
    })
  },

  /**
   * 检查权限
   */
  async checkPermissions() {
    try {
      // 根据配置检查位置权限
      if (isFeatureEnabled('enableLocation')) {
        const locationResult = await this.checkLocationPermission()
        this.setData({
          hasLocationPermission: locationResult
        })
      } else {
        console.log('📍 位置权限检查已禁用')
        this.setData({
          hasLocationPermission: false
        })
      }
    } catch (error) {
      console.warn('权限检查失败:', error)
    }
  },

  /**
   * 检查位置权限
   */
  checkLocationPermission() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          resolve(!!res.authSetting['scope.userLocation'])
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  /**
   * web-view加载完成
   */
  onWebViewLoad() {
    console.log('🌐 web-view加载完成')

    this.setData({
      showLoading: false
    })

    // 向H5页面发送初始化消息
    this.sendToH5('init', {
      hasLocationPermission: this.data.hasLocationPermission,
      timestamp: Date.now()
    })
    // 发送测试 ping，确认 web-view 与小程序消息通道
    try {
      this.sendToH5('mini_ping', { test: true, timestamp: Date.now() })
      console.log('✅ 发送 mini_ping 到 H5')
    } catch (e) {
      console.warn('⚠️ 发送 mini_ping 失败', e)
    }
  },

  /**
   * web-view加载失败
   */
  onWebViewError(e) {
    console.error('❌ web-view加载失败:', e)
    this.showError('H5页面加载失败，请检查网络连接')
  },

  /**
   * 接收来自H5页面的消息
   */
  onWebViewMessage(e) {
    const data = e.detail.data || []
    console.log('📨 收到H5消息:', data)

    data.forEach(message => {
      this.handleH5Message(message)
    })
  },

  /**
   * 处理H5页面发送的消息
   */
  handleH5Message(message) {
    const { type, payload } = message

    switch (type) {
      case 'ready':
        console.log('✅ H5页面准备就绪')
        // H5页面加载完成，可以开始初始化
        this.onH5Ready(payload)
        break

      case 'webview_ping':
        console.log('📨 收到来自 H5 的 ping:', payload)
        // 给用户可视反馈，确认通信已到达宿主
        wx.showToast({
          title: 'H5 已连接',
          icon: 'success',
          duration: 1200
        })
        break

      case 'mini_ping':
        console.log('📨 H5 回复 mini_ping:', payload)
        // 显式通知（调试用）
        wx.showToast({
          title: 'H5 已响应',
          icon: 'none',
          duration: 1000
        })
        break

      case 'error':
        console.error('❌ H5页面错误:', payload)
        this.handleH5Error(payload)
        break

      case 'user_action':
        this.handleUserAction(payload)
        break

      case 'request_permission':
        this.handlePermissionRequest(payload)
        break

      case 'share':
        this.handleShareRequest(payload)
        break

      default:
        console.log('📝 未处理的H5消息类型:', type, payload)
    }
  },

  /**
   * H5页面准备就绪
   */
  onH5Ready(payload) {
    console.log('🎉 3D校园系统启动完成')

      wx.showToast({
        title: '3D校园加载完成',
        icon: 'success',
        duration: 1500
      })
  },

  /**
   * 处理H5错误
   */
  handleH5Error(error) {
    console.error('H5页面报告错误:', error)

    wx.showModal({
      title: '3D功能异常',
      content: error.message || '3D校园功能出现异常，请重试',
      showCancel: true,
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 重新加载web-view
          this.reloadWebView()
    }
      }
    })
  },

  /**
   * 处理用户行为
   */
  handleUserAction(action) {
    console.log('👤 用户行为:', action)

    // 可以在这里添加数据统计、行为分析等
    // 例如：用户点击了某个建筑、使用了某个功能等
  },

  /**
   * 处理权限请求
   */
  async handlePermissionRequest(permission) {
    console.log('🔑 权限请求:', permission)

    try {
      switch (permission.type) {
        case 'location':
          await this.requestLocationPermission()
          this.sendToH5('permission_granted', { type: 'location' })
          break

        default:
          console.warn('未知权限类型:', permission.type)
      }
    } catch (error) {
      console.error('权限请求失败:', error)
      this.sendToH5('permission_denied', {
        type: permission.type,
        error: error.message
      })
    }
  },

  /**
   * 请求位置权限
   */
  requestLocationPermission() {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          console.log('✅ 位置权限已授权')
          this.setData({ hasLocationPermission: true })
          resolve()
        },
        fail: (error) => {
          console.warn('❌ 位置权限被拒绝:', error)
          reject(new Error('用户拒绝授权位置权限'))
    }
      })
    })
  },

  /**
   * 处理分享请求
   */
  handleShareRequest(shareData) {
    console.log('📤 分享请求:', shareData)

    // 检查分享功能是否启用
    if (!isFeatureEnabled('enableShare')) {
      wx.showToast({
        title: '分享功能已禁用',
        icon: 'none'
      })
      return
    }

    // 使用小程序的分享功能
    wx.showShareMenu({
      withShareTicket: true
    })

    // 可以在这里自定义分享内容
    wx.showActionSheet({
      itemList: ['分享给好友', '分享到朋友圈', '生成海报'],
      success: (res) => {
        const tapIndex = res.tapIndex
        switch (tapIndex) {
          case 0:
            // 分享给好友
            console.log('分享给好友')
            break
          case 1:
            // 分享到朋友圈（小程序无法直接分享到朋友圈，需要生成海报）
            this.generatePoster(shareData)
            break
          case 2:
            // 生成海报
            this.generatePoster(shareData)
            break
        }
      }
    })
  },

  /**
   * 生成海报
   */
  generatePoster(shareData) {
    wx.showLoading({
      title: '生成海报中...'
    })

    // 这里可以调用海报生成服务
    // 暂时显示一个提示
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '海报生成成功',
        icon: 'success'
      })
    }, 2000)
  },

  /**
   * 向H5页面发送消息
   */
  sendToH5(type, payload = null) {
    const webview = this.selectComponent('#webview')
    if (webview) {
      webview.postMessage({
        type,
        payload,
        timestamp: Date.now()
      })
    } else {
      console.warn('webview组件未找到')
    }
  },

  /**
   * 重新加载web-view
   */
  reloadWebView() {
    console.log('🔄 重新加载web-view')

    this.setData({
      showLoading: true,
      loadingText: '重新加载中...'
    })

    // 重新设置URL来触发重新加载
    const currentSrc = this.data.webviewSrc
    this.setData({
      webviewSrc: ''
    })

    setTimeout(() => {
      this.setData({
        webviewSrc: currentSrc
      })
    }, 100)
  },

  /**
   * 显示错误
   */
  showError(message) {
    this.setData({
      showLoading: false
    })

      wx.showModal({
      title: '加载失败',
      content: message,
        showCancel: false,
      confirmText: '重试',
      success: () => {
        this.reloadWebView()
      }
    })
  },

  /**
   * 版本比较工具函数
   */
  compareVersion(version1, version2) {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0

      if (num1 > num2) return 1
      if (num1 < num2) return -1
    }

    return 0
  },

  /**
   * 清理资源
   */
  cleanup() {
    // 清理定时器、事件监听等
    console.log('🧹 清理小程序页面资源')
  }
})