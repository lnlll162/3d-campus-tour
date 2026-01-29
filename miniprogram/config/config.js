/**
 * 小程序配置文件
 * 集中管理所有配置项，便于不同环境的管理
 */

// 环境配置
const ENV_CONFIG = {
  // H5页面URL配置 - 根据不同环境设置不同的URL
  h5Urls: {
    develop: 'http://172.20.10.2:5173',          // 本地开发环境（已自动替换为本机局域网 IP）
    trial: 'https://your-trial-domain.com',    // 体验版环境
    release: 'https://your-production-domain.com' // 正式版环境
  },

  // CDN配置 - 用于静态资源
  cdnUrls: {
    develop: '',
    trial: 'https://cdn-trial.your-domain.com',
    release: 'https://cdn.your-domain.com'
  },

  // API配置
  apis: {
    develop: 'http://localhost:3000/api',
    trial: 'https://api-trial.your-domain.com',
    release: 'https://api.your-domain.com'
  },

  // 功能开关
  features: {
    enableLocation: true,      // 启用位置服务
    enableShare: true,         // 启用分享功能
    enableAnalytics: false,    // 启用数据分析（开发环境关闭）
    enableDebug: false         // 启用调试模式
  },

  // 版本信息
  version: '1.0.0',
  buildTime: new Date().toISOString()
}

/**
 * 获取当前环境的配置
 */
function getCurrentConfig() {
  const accountInfo = wx.getAccountInfoSync()
  const envVersion = accountInfo.miniProgram.envVersion || 'develop'

  return {
    env: envVersion,
    ...ENV_CONFIG,
    // 根据环境调整功能开关
    features: {
      ...ENV_CONFIG.features,
      enableDebug: envVersion === 'develop',
      enableAnalytics: envVersion === 'release'
    }
  }
}

/**
 * 获取H5页面URL
 */
function getH5Url() {
  const config = getCurrentConfig()
  const baseUrl = config.h5Urls[config.env] || config.h5Urls.develop
  // 开发时优先使用本地覆盖（便于在小程序 web-view 中访问开发服务器）
  // 使用方法（微信开发者工具 Console）:
  //   wx.setStorageSync('localDevHost', 'http://192.168.1.10:5173')
  // 该值仅在 env === 'develop' 时优先使用，方便在 web-view 中用局域网 IP 替代 localhost
  try {
    if (typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function') {
      const localHost = wx.getStorageSync('localDevHost')
      if (localHost && config.env === 'develop') {
        // 确保结尾没有斜杠
        const trimmed = String(localHost).replace(/\/$/, '')
        console.log('Using local dev host override from storage:', trimmed)
        return `${trimmed}/index.html`
      }
    }
  } catch (e) {
    // 忽略读取本地覆盖时的任何异常，回退到默认配置
    console.warn('Failed to read localDevHost override:', e)
  }

  // 确保URL格式正确
  let url = baseUrl
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  return `${url}/index.html`
}

/**
 * 获取CDN URL
 */
function getCdnUrl(path = '') {
  const config = getCurrentConfig()
  const baseUrl = config.cdnUrls[config.env] || config.cdnUrls.release

  if (!baseUrl) return path

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * 获取API URL
 */
function getApiUrl(endpoint = '') {
  const config = getCurrentConfig()
  const baseUrl = config.apis[config.env] || config.apis.develop

  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

/**
 * 检查功能是否启用
 */
function isFeatureEnabled(featureName) {
  const config = getCurrentConfig()
  return config.features[featureName] === true
}

module.exports = {
  getCurrentConfig,
  getH5Url,
  getCdnUrl,
  getApiUrl,
  isFeatureEnabled
}
