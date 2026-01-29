# GLTF 加载（H5 / Three.js）指南

## 🎯 项目概述

项目采用 **H5-first** 开发策略，先在浏览器环境中使用 Three.js 开发和验证 3D 功能，再通过 web-view 集成到微信小程序。本文档专注于 H5 端的 GLTF/GLB 模型加载最佳实践。

## ✅ H5 端实现方案

### 1. 现代化 Three.js GLTFLoader
- ✅ 使用官方 Three.js GLTFLoader (v160+)
- ✅ 原生支持 GLTF/GLB 格式
- ✅ 完整的 PBR 材质和纹理支持
- ✅ Draco 压缩和 KTX2 纹理支持

### 2. 推荐的项目结构
```javascript
// web/src/scene/BuildingLoader.js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

export class BuildingLoader {
  constructor(manager) {
    this.loader = new GLTFLoader(manager)
    // 配置 Draco 解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    this.loader.setDRACOLoader(dracoLoader)

    // 配置 KTX2 纹理解码器
    const ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath('/ktx2/')
    this.loader.setKTX2Loader(ktx2Loader)
  }

  async loadModel(url, onProgress) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf),
        onProgress,
        reject
      )
    })
  }
}
```

### 3. 小程序容器端通信
小程序作为容器，通过 web-view 加载 H5 页面，使用 postMessage 进行双向通信：

```javascript
// 小程序端 (miniprogram/pages/campus/campus.js)
Page({
  onLoad() {
    // 监听 H5 页面的消息
    this.bindMessage()
  },

  bindMessage() {
    const webview = this.selectComponent('#webview')
    webview.onMessage((data) => {
      console.log('收到H5消息:', data)
      // 处理模型加载状态、用户交互等
    })
  },

  // 向 H5 发送消息
  sendToH5(data) {
    const webview = this.selectComponent('#webview')
    webview.postMessage(data)
  }
})
```

### 4. H5 端消息处理
```javascript
// web/src/utils/miniprogram-bridge.js
export class MiniProgramBridge {
  constructor() {
    this.isMiniProgram = /miniprogram/i.test(navigator.userAgent)
  }

  // 发送消息到小程序
  postMessage(data) {
    if (this.isMiniProgram && window.parent) {
      window.parent.postMessage(data, '*')
    }
  }

  // 监听小程序消息
  onMessage(callback) {
    window.addEventListener('message', (event) => {
      callback(event.data)
    })
  }
}
```

## 🏗️ H5 端最佳实践

### Three.js GLTFLoader 使用
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { LoadingManager } from 'three'

// 1. 创建加载管理器
const manager = new LoadingManager()
manager.onProgress = (url, loaded, total) => {
  console.log(`加载进度: ${url} (${loaded}/${total})`)
}

// 2. 配置 GLTFLoader
const loader = new GLTFLoader(manager)

// 3. 配置 Draco 压缩支持
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

// 4. 配置 KTX2 纹理支持
const ktx2Loader = new KTX2Loader()
ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/')
loader.setKTX2Loader(ktx2Loader)

// 5. 加载模型
loader.load(
  '/models/building.glb',
  (gltf) => {
    scene.add(gltf.scene)
    console.log('模型加载完成')
  },
  (progress) => {
    console.log('加载进度:', (progress.loaded / progress.total * 100) + '%')
  },
  (error) => {
    console.error('加载失败:', error)
  }
)
```

### Vite 构建配置
```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'three-addons': [
            'three/examples/jsm/loaders/GLTFLoader.js',
            'three/examples/jsm/loaders/DRACOLoader.js',
            'three/examples/jsm/loaders/KTX2Loader.js'
          ]
        }
      }
    }
  }
})
```

## 📊 H5 端性能优化

### 模型优化策略
```javascript
// 1. 使用实例化渲染减少draw calls
import { InstancedMesh } from 'three'

const createInstancedBuildings = (gltf, count) => {
  const mesh = gltf.scene.children[0]
  const instancedMesh = new InstancedMesh(
    mesh.geometry,
    mesh.material,
    count
  )

  // 设置每个实例的位置、旋转、缩放
  for (let i = 0; i < count; i++) {
    const matrix = new Matrix4()
    matrix.setPosition(Math.random() * 100, 0, Math.random() * 100)
    instancedMesh.setMatrixAt(i, matrix)
  }

  return instancedMesh
}

// 2. 纹理压缩和Mipmap
const texture = new TextureLoader().load('/textures/building.jpg')
texture.generateMipmaps = true
texture.minFilter = LinearMipmapLinearFilter

// 3. 几何体合并优化
const mergeGeometries = (geometries) => {
  const merged = BufferGeometryUtils.mergeGeometries(geometries)
  return new Mesh(merged, material)
}
```

### 内存管理
```javascript
// 1. 及时释放资源
const disposeModel = (object3D) => {
  object3D.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(material => material.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}

// 2. 使用对象池复用对象
class ObjectPool {
  constructor(createFn, maxSize = 10) {
    this.pool = []
    this.createFn = createFn
    this.maxSize = maxSize
  }

  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn()
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj)
    } else {
      disposeModel(obj) // 超出限制则销毁
    }
  }
}
```

### 加载优化
```javascript
// 1. 并行加载多个模型
const loadMultipleModels = async (urls) => {
  const promises = urls.map(url =>
    new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })
  )
  return Promise.all(promises)
}

// 2. 预加载关键资源
const preloadCriticalAssets = () => {
  // 预加载主要建筑模型
  const criticalModels = ['library.glb', 'dormitory.glb']
  criticalModels.forEach(url => {
    loader.load(url, () => {}, undefined, () => {})
  })
}

// 3. 按需加载和缓存
const modelCache = new Map()
const loadModelCached = async (url) => {
  if (modelCache.has(url)) {
    return modelCache.get(url).clone()
  }

  const gltf = await new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })

  modelCache.set(url, gltf.scene)
  return gltf.scene.clone()
}
```

## 🔄 从小程序原生到 H5-first 的迁移指南

### 迁移步骤
1. **保留小程序容器**: 保持小程序作为入口和权限管理
2. **迁移3D逻辑到H5**: 将所有Three.js代码移至web/目录
3. **建立通信桥梁**: 使用postMessage实现H5与小程序通信
4. **更新构建流程**: 调整CI/CD以支持H5构建和部署

### 代码迁移示例
```javascript
// 旧的小程序代码 (miniprogram/pages/campus/campus.js)
// 需要迁移到 web/src/scene/CampusScene.js

// 小程序原生方式
const canvas = wx.createCanvas()
const renderer = new THREE.WebGLRenderer({ canvas })

// H5方式
const canvas = document.getElementById('viewer-container')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
```

### 通信协议设计
```javascript
// 消息类型定义
const MESSAGE_TYPES = {
  MODEL_LOAD_START: 'model_load_start',
  MODEL_LOAD_PROGRESS: 'model_load_progress',
  MODEL_LOAD_COMPLETE: 'model_load_complete',
  USER_INTERACTION: 'user_interaction',
  CAMERA_POSITION: 'camera_position'
}

// H5发送消息到小程序
window.parent.postMessage({
  type: MESSAGE_TYPES.MODEL_LOAD_COMPLETE,
  data: { modelId: 'library', success: true }
}, '*')

// 小程序监听消息
webview.onMessage((msg) => {
  switch (msg.type) {
    case MESSAGE_TYPES.MODEL_LOAD_COMPLETE:
      console.log('模型加载完成:', msg.data)
      break
  }
})
```

## 🎯 最佳实践总结

### H5-first 优势
- **开发体验**: 完整的浏览器调试工具和热重载
- **性能**: 原生WebGL，完整的Three.js功能支持
- **兼容性**: 标准的Web技术栈，更好的跨平台支持
- **维护性**: 代码分离，职责清晰

### 性能目标
- **加载时间**: < 3秒首屏加载
- **帧率**: 60 FPS稳定运行
- **内存**: < 100MB运行时内存
- **兼容性**: 支持95%以上的现代浏览器

### 监控和调试
```javascript
// 性能监控
const stats = new Stats()
document.body.appendChild(stats.dom)

function animate() {
  stats.begin()
  renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(animate)
}

// 错误上报
window.addEventListener('error', (event) => {
  // 发送错误信息到小程序容器
  window.parent.postMessage({
    type: 'error',
    data: {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno
    }
  }, '*')
})
```

## 📚 参考资料

### Three.js官方文档
- [GLTFLoader](https://threejs.org/docs/#examples/loaders/GLTFLoader)
- [DRACOLoader](https://threejs.org/docs/#examples/loaders/DRACOLoader)
- [KTX2Loader](https://threejs.org/docs/#examples/loaders/KTX2Loader)

### 现代Web开发
- [Vite构建工具](https://vitejs.dev/)
- [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [WebGL 2.0](https://www.khronos.org/webgl/)

### 小程序集成
- [web-view组件](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)
- [postMessage通信](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

---

*H5-first 架构重构完成，为3D校园云旅游项目提供了现代化、高性能的3D渲染解决方案！* 🚀

