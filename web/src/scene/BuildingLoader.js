import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { LoadingManager } from 'three'

/**
 * 建筑模型加载器
 * 负责加载和管理3D建筑模型
 */
export class BuildingLoader {
  constructor(manager) {
    this.manager = manager || new LoadingManager()
    this.loader = new GLTFLoader(this.manager)

    // 配置 Draco 解码器
    this.setupDRACO()

    // 配置 KTX2 纹理解码器
    this.setupKTX2()

    // 缓存已加载的模型
    this.modelCache = new Map()
  }

  /**
   * 配置 Draco 压缩支持
   */
  setupDRACO() {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    dracoLoader.setDecoderConfig({ type: 'js' })
    this.loader.setDRACOLoader(dracoLoader)
  }

  /**
   * 配置 KTX2 纹理支持
   */
  setupKTX2() {
    const ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/')
    this.loader.setKTX2Loader(ktx2Loader)
  }

  /**
   * 加载单个建筑模型
   * @param {string} url - 模型URL
   * @param {Object} options - 加载选项
   * @returns {Promise} GLTF对象
   */
  async loadBuilding(url, options = {}) {
    const {
      onProgress,
      useCache = true,
      cacheKey
    } = options

    // 检查缓存
    if (useCache && this.modelCache.has(url)) {
      return this.modelCache.get(url).clone()
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          // 缓存模型
          if (useCache) {
            this.modelCache.set(url, gltf.scene.clone())
          }

          console.log(`✅ 模型加载完成: ${url}`)
          resolve(gltf)
        },
        (progress) => {
          if (onProgress) {
            onProgress(progress)
          }

          console.log(`📦 模型加载进度: ${url} (${Math.round(progress.loaded / progress.total * 100)}%)`)
        },
        (error) => {
          console.error('❌ 模型加载失败:', url, error)
          reject(error)
        }
      )
    })
  }

  /**
   * 批量加载建筑模型
   * @param {Array} buildings - 建筑配置数组
   * @returns {Promise} 加载结果
   */
  async loadBuildings(buildings) {
    const promises = buildings.map(building =>
      this.loadBuilding(building.url, building.options)
    )

    return Promise.all(promises)
  }

  /**
   * 预加载关键建筑
   * @param {Array} criticalBuildings - 关键建筑URL数组
   */
  preloadCriticalBuildings(criticalBuildings) {
    criticalBuildings.forEach(url => {
      // 后台预加载，不阻塞主线程
      this.loadBuilding(url, { useCache: true })
    })
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.modelCache.clear()
  }

  /**
   * 获取缓存状态
   */
  getCacheStats() {
    return {
      size: this.modelCache.size,
      urls: Array.from(this.modelCache.keys())
    }
  }
}
