import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BuildingLoader } from './BuildingLoader.js'

export class CampusScene {
  formatModelLoadError(error, url) {
    const raw = error?.message ? String(error.message) : String(error)
    let reason = '未知原因'

    if (/draco/i.test(raw)) {
      reason = 'Draco 解码失败（可能是解码器不可用或模型使用了 Draco 压缩）'
    } else if (/ktx2|basis/i.test(raw)) {
      reason = 'KTX2/Basis 纹理解码失败（可能是转码器不可用或纹理格式不支持）'
    } else if (/404|not found/i.test(raw)) {
      reason = '资源不存在（请检查模型 URL 或静态目录）'
    } else if (/syntax|json|parse|gltf/i.test(raw)) {
      reason = 'GLB/GLTF 解析失败（文件可能损坏或格式不兼容）'
    } else if (/network|failed to fetch|load/i.test(raw)) {
      reason = '网络加载失败（请检查网络/跨域/域名配置）'
    }

    return `模型加载失败：${url}\n原因：${reason}\n原始错误：${raw}`
  }

  showError(message) {
    // 同时 alert + console，开发期更容易发现问题
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message)
    }
  }

  frameObject(object) {
    if (!this.camera || !this.controls) return

    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1

    // 根据 FOV 计算合适的相机距离
    const fov = (this.camera.fov * Math.PI) / 180
    const fitHeightDistance = (maxDim / 2) / Math.tan(fov / 2)
    const fitWidthDistance = fitHeightDistance / (this.camera.aspect || 1)
    const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance)

    // 以一个斜上方视角对准模型中心
    this.controls.target.copy(center)
    this.camera.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance)

    this.camera.near = Math.max(0.1, distance / 100)
    this.camera.far = Math.max(1000, distance * 10)
    this.camera.updateProjectionMatrix()

    this.controls.update()
  }

  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.isInitialized = false

    // 场景对象
    this.buildings = new Map()
    this.lights = []

    // 鼠标交互
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.onBuildingClick = null // 建筑点击回调函数
    this.hoveredBuilding = null // 当前悬停的建筑
  }

  async init() {
    console.log('🎬 初始化3D校园场景...')

    try {
      this.createScene()
      this.createCamera()
      this.createRenderer()
      this.createLights()
      this.createControls()
      this.createGround()
      await this.loadBuildings()

      // 添加到DOM
      const app = document.getElementById('app')
      if (app && this.renderer) {
        app.appendChild(this.renderer.domElement)

        // 设置鼠标事件监听
        this.setupMouseEvents()
      }

      this.isInitialized = true
      console.log('✅ 3D场景初始化完成')

    } catch (error) {
      console.error('❌ 场景初始化失败:', error)
      throw error
    }
  }

  createScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB) // 天蓝色
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200)
  }

  createCamera() {
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    this.camera.position.set(10, 15, 10)
    this.camera.lookAt(0, 0, 0)
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
  }

  createLights() {
    // 主光源（太阳光） - 提高强度以适配 MeshStandardMaterial
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
    directionalLight.position.set(50, 50, 25)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50

    // 环境光 - 提高强度，避免整体发灰
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)

    // 半球光 - 地面色改中性灰，避免染色
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.5)

    this.scene.add(directionalLight, ambientLight, hemisphereLight)
    this.lights.push(directionalLight, ambientLight, hemisphereLight)
  }

  createControls() {
    if (!this.camera || !this.renderer) return

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05

    // 放开观察限制，便于全方位查看模型
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = Math.PI * 0.99
    this.controls.minDistance = 1
    this.controls.maxDistance = 300
  }

  createGround() {
    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a7a7a,
      roughness: 1,
      metalness: 0
    })

    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true

    // 避免地面叠色/雾效影响整体观感
    ground.renderOrder = -1
    ground.material.depthWrite = true

    this.scene.add(ground)
  }

  async loadBuildings() {
    // 优先加载本地GLB模型（开发阶段）
    try {
      await this.loadSingleCampusModel('/models/library.glb')
      return
    } catch (error) {
      const message = this.formatModelLoadError(error, '/models/library.glb')
      console.error(message, error)
      this.showError(message)
    }

    // 回退：创建一些基础的建筑作为示例
    await this.createSampleBuildings()
  }

  async createSampleBuildings() {
    // 创建示例建筑
    const buildings = [
      { id: 'library', name: '图书馆', position: [0, 0, 0], size: [8, 12, 6], color: 0x8B4513 },
      { id: 'dormitory', name: '宿舍楼', position: [15, 0, 0], size: [6, 8, 4], color: 0x696969 },
      { id: 'classroom', name: '教学楼', position: [-15, 0, 0], size: [10, 6, 5], color: 0x4169E1 }
    ]

    for (const building of buildings) {
      this.createBuilding(building)
    }
  }

  async loadSingleCampusModel(url) {
    if (!this.scene) return

    const loader = new BuildingLoader()
    const gltf = await loader.loadBuilding(url)

    const modelRoot = gltf.scene
    modelRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })

    // 先给一个合理的默认放置方式，避免模型“飞走/过大/过小”
    const box = new THREE.Box3().setFromObject(modelRoot)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // 将模型中心移到世界原点附近（先居中到(0,0,0)）
    modelRoot.position.sub(center)

    // 根据包围盒大小自动缩放到大约 20m 量级
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const target = 20
    const scale = target / maxDim
    modelRoot.scale.setScalar(scale)

    // 确保模型“落地”：把包围盒底部对齐到 y=0（地面）
    const boxAfter = new THREE.Box3().setFromObject(modelRoot)
    modelRoot.position.y -= boxAfter.min.y

    modelRoot.userData = {
      id: 'library',
      name: '图书馆',
      type: 'building'
    }

    this.scene.add(modelRoot)
    this.buildings.set('library', modelRoot)

    console.log(`🏛️ 已加载模型: ${url}`, { size: size.toArray(), center: center.toArray(), scale })

    // 自动把相机对准模型，方便完整观察
    this.frameObject(modelRoot)
  }

  createBuilding(config) {
    const geometry = new THREE.BoxGeometry(...config.size)
    const material = new THREE.MeshLambertMaterial({ color: config.color })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(...config.position)
    mesh.position.y = config.size[1] / 2
    mesh.castShadow = true
    mesh.receiveShadow = true

    // 添加建筑信息
    mesh.userData = {
      id: config.id,
      name: config.name,
      type: 'building'
    }

    this.scene.add(mesh)
    this.buildings.set(config.id, mesh)

    console.log(`🏗️ 创建建筑: ${config.name}`)

    // 示例建筑也自动对焦一次
    if (config.id === 'library') {
      this.frameObject(mesh)
    }
  }

  render() {
    if (!this.isInitialized) return

    // 更新控制器
    if (this.controls) {
      this.controls.update()
    }

    // 渲染场景
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  onResize() {
    if (!this.camera || !this.renderer) return

    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  onTouchMove(deltaX, deltaY) {
    // 处理触摸移动
    if (this.controls) {
      // 可以在这里添加触摸控制逻辑
    }
  }

  /**
   * 设置鼠标事件监听
   */
  setupMouseEvents() {
    if (!this.renderer) return

    const canvas = this.renderer.domElement

    // 鼠标移动事件 - 用于悬停效果
    canvas.addEventListener('mousemove', (event) => {
      this.onMouseMove(event)
    })

    // 鼠标点击事件
    canvas.addEventListener('click', (event) => {
      this.onMouseClick(event)
    })

    // 鼠标离开canvas事件
    canvas.addEventListener('mouseleave', () => {
      this.onMouseLeave()
    })

    console.log('🖱️ 鼠标事件监听已设置')
  }

  /**
   * 鼠标移动事件处理
   */
  onMouseMove(event) {
    if (!this.camera || !this.scene) return

    // 计算鼠标在标准化设备坐标中的位置 (-1 到 +1)
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 从相机向鼠标位置发射射线
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // 计算射线与建筑的交点
    const buildingMeshes = Array.from(this.buildings.values())
    const intersects = this.raycaster.intersectObjects(buildingMeshes, true)

    // 处理悬停效果
    this.handleHoverEffect(intersects)
  }

  /**
   * 处理悬停效果
   */
  handleHoverEffect(intersects) {
    // 重置之前悬停的建筑
    if (this.hoveredBuilding) {
      this.hoveredBuilding.material.emissive.setHex(0x000000)
      this.hoveredBuilding = null
    }

    // 设置新悬停的建筑
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object
      if (intersectedObject.userData.type === 'building') {
        this.hoveredBuilding = intersectedObject
        // 添加发光效果
        intersectedObject.material.emissive.setHex(0x222222)

        // 改变鼠标样式
        this.renderer.domElement.style.cursor = 'pointer'
      }
    } else {
      // 恢复默认鼠标样式
      this.renderer.domElement.style.cursor = 'grab'
    }
  }

  /**
   * 鼠标点击事件处理
   */
  onMouseClick(event) {
    if (!this.camera || !this.scene) return

    // 计算鼠标位置
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 发射射线检测点击的建筑
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const buildingMeshes = Array.from(this.buildings.values())
    const intersects = this.raycaster.intersectObjects(buildingMeshes, true)

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object
      if (clickedObject.userData.type === 'building') {
        console.log('🏗️ 点击建筑:', clickedObject.userData.name)

        // 触发建筑点击回调
        if (this.onBuildingClick) {
          this.onBuildingClick(clickedObject.userData)
        }

        // 添加点击动画效果
        this.animateBuildingClick(clickedObject)
      }
    }
  }

  /**
   * 鼠标离开canvas事件处理
   */
  onMouseLeave() {
    // 清除悬停效果
    if (this.hoveredBuilding) {
      this.hoveredBuilding.material.emissive.setHex(0x000000)
      this.hoveredBuilding = null
    }

    // 恢复默认鼠标样式
    if (this.renderer) {
      this.renderer.domElement.style.cursor = 'grab'
    }
  }

  /**
   * 建筑点击动画效果
   */
  animateBuildingClick(building) {
    const originalScale = building.scale.clone()
    const targetScale = originalScale.clone().multiplyScalar(1.1)

    // 放大动画
    const animateUp = () => {
      building.scale.lerp(targetScale, 0.1)
      if (building.scale.distanceTo(targetScale) > 0.01) {
        requestAnimationFrame(animateUp)
      } else {
        // 缩小回原大小
        const animateDown = () => {
          building.scale.lerp(originalScale, 0.1)
          if (building.scale.distanceTo(originalScale) > 0.01) {
            requestAnimationFrame(animateDown)
          }
        }
        setTimeout(animateDown, 100)
      }
    }

    animateUp()
  }

  resetCamera() {
    if (this.camera && this.controls) {
      // 重置到初始位置
      this.camera.position.set(10, 15, 10)
      this.controls.target.set(0, 0, 0)
      this.controls.update()
    }
  }

  navigateToBuilding(buildingId) {
    const building = this.buildings.get(buildingId)
    if (building && this.controls) {
      const targetPosition = building.position.clone()
      targetPosition.y += 5 // 稍微高于建筑

      // 平滑移动到建筑位置
      this.controls.target.copy(building.position)
      this.camera.position.lerp(targetPosition, 0.1)
    }
  }

  setCameraPosition(position) {
    if (this.camera) {
      this.camera.position.set(position.x, position.y, position.z)
    }
  }

  dispose() {
    // 清理资源
    if (this.renderer) {
      this.renderer.dispose()
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }

    this.isInitialized = false
  }
}
