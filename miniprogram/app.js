// 3D校园小程序主入口 - H5-first架构
App({
  onLaunch(options) {
    console.log('🚀 小程序启动', options)

    // 初始化应用
    this.initApp()

    // 检查更新
    this.checkUpdate()
  },

  onShow(options) {
    console.log('📱 小程序显示', options)
  },

  onHide() {
    console.log('👁️ 小程序隐藏')
  },

  onError(msg) {
    console.error('❌ 小程序错误:', msg)
    // 可以在这里上报错误信息
  },

  initApp() {
    // 获取系统信息 (使用新的API)
    Promise.all([
      this.getDeviceInfo(),
      this.getAppBaseInfo(),
      this.getWindowInfo()
    ]).then(([deviceInfo, appBaseInfo, windowInfo]) => {
      const systemInfo = { ...deviceInfo, ...appBaseInfo, ...windowInfo }
      console.log('📱 系统信息:', systemInfo)
      this.globalData.systemInfo = systemInfo

      // 检查基础库版本 (web-view需要2.5.0+)
      const SDKVersion = appBaseInfo.SDKVersion.split('.').map(Number)
      const minVersion = [2, 5, 0]

      let webViewSupported = true
      for (let i = 0; i < 3; i++) {
        if (SDKVersion[i] > minVersion[i]) break
        if (SDKVersion[i] < minVersion[i]) {
          webViewSupported = false
          break
        }
      }

      if (!webViewSupported) {
        wx.showModal({
          title: '版本过低',
          content: '当前基础库版本过低，无法正常体验3D校园。请升级微信到最新版本。',
          showCancel: false
        })
      }

      this.globalData.webViewSupported = webViewSupported
    }).catch((err) => {
      console.error('获取系统信息失败:', err)
      // 默认设置为支持，实际运行时会检查
      this.globalData.webViewSupported = true
    })

    // 获取网络状态
    wx.getNetworkType({
      success: (res) => {
        console.log('🌐 网络状态:', res)
        this.globalData.networkType = res.networkType
      }
    })
  },


  checkUpdate() {
    // 检查小程序更新
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        console.log('🔄 检查更新:', res.hasUpdate)
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
    }
  },

  // 获取设备信息
  getDeviceInfo() {
    return new Promise((resolve, reject) => {
      wx.getDeviceInfo({
        success: resolve,
        fail: reject
      })
    })
  },

  // 获取应用基础信息
  getAppBaseInfo() {
    return new Promise((resolve, reject) => {
      wx.getAppBaseInfo({
        success: resolve,
        fail: reject
      })
    })
  },

  // 获取窗口信息
  getWindowInfo() {
    return new Promise((resolve, reject) => {
      wx.getWindowInfo({
        success: resolve,
        fail: reject
      })
    })
  },

  // 全局数据
  globalData: {
    systemInfo: null,
    networkType: '',
    // 默认设为 true，initApp 将在获取到基础库版本后更新此值
    webViewSupported: true,
    userInfo: null,
    campusConfig: {
      version: '1.0.0',
      // H5页面URL配置
      h5Urls: {
        develop: 'http://localhost:5173',
        trial: 'https://your-trial-domain.com',
        release: 'https://your-production-domain.com'
      }
    }
  }
})