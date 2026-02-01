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

  setViewMode(mode) {
    console.log('CampusScene: setViewMode', mode)
    if (!mode) return

    // 清理旧模式
    this.cleanupViewMode()

    this.viewMode = mode

    if (mode === 'orbit') {
      this.enableOrbitMode()
    } else if (mode === 'fpv') {
      this.enableFirstPersonMode()
    } else if (mode === 'tpv') {
      this.enableThirdPersonMode()
    }
  }

  cleanupViewMode() {
    // 移除第一/第三人称的事件监听和摇杆
    if (this._fpvCleanup) {
      try { this._fpvCleanup() } catch (_) {}
    }
    this._fpvCleanup = null

    if (this._tpvCleanup) {
      try { this._tpvCleanup() } catch (_) {}
    }
    this._tpvCleanup = null

    if (this.joystickEl && this.joystickEl.parentNode) {
      this.joystickEl.parentNode.removeChild(this.joystickEl)
    }
    this.joystickEl = null

    // 重置鼠标样式
    if (this.renderer?.domElement) {
      this.renderer.domElement.style.cursor = 'grab'
    }
  }

  enableOrbitMode() {
    if (!this.camera || !this.renderer) return

    // OrbitControls 已存在就复用，否则创建
    if (!this.controls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.05
      this.controls.minPolarAngle = 0
      this.controls.maxPolarAngle = Math.PI * 0.99
      this.controls.minDistance = 1
      this.controls.maxDistance = 300
    }

    this.controls.enabled = true
  }

  enableFirstPersonMode() {
    if (!this.camera || !this.renderer) return

    // 禁用 orbit
    if (this.controls) this.controls.enabled = false

    const canvas = this.renderer.domElement

    // 第一人称状态
    this.fpv = {
      yaw: 0,
      pitch: 0,
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      speed: 10,
      height: 1.6,
      lookSensitivity: 0.002,
      joystick: { x: 0, y: 0 }
    }

    // 初始化相机高度
    this.camera.position.y = Math.max(this.camera.position.y, this.fpv.height)

    // 鼠标/触摸拖动看向（移动端用单指拖拽控制视角）
    let dragging = false
    let lastX = 0
    let lastY = 0

    const shouldHandleLook = (clientX, clientY) => {
      // 仅处理右半屏拖拽，避免与左下摇杆冲突
      return clientX > window.innerWidth * 0.35
    }

    const onMouseDown = (e) => {
      if (!shouldHandleLook(e.clientX, e.clientY)) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }

    const onMouseUp = () => { dragging = false }

    const onMouseMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY

      this.fpv.yaw -= dx * this.fpv.lookSensitivity
      this.fpv.pitch -= dy * this.fpv.lookSensitivity
      const limit = Math.PI / 2 - 0.01
      this.fpv.pitch = Math.max(-limit, Math.min(limit, this.fpv.pitch))
    }

    let activeTouchId = null
    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return
      // 如果已经有视角触控，就不抢占（避免多指）
      if (activeTouchId !== null) return

      // 找到第一个符合右侧区域的触点
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i]
        if (shouldHandleLook(t.clientX, t.clientY)) {
          activeTouchId = t.identifier
          dragging = true
          lastX = t.clientX
          lastY = t.clientY
          e.preventDefault()
          break
        }
      }
    }

    const onTouchMove = (e) => {
      if (activeTouchId === null) return
      let t = null
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === activeTouchId) { t = e.touches[i]; break }
      }
      if (!t) return

      const dx = t.clientX - lastX
      const dy = t.clientY - lastY
      lastX = t.clientX
      lastY = t.clientY

      this.fpv.yaw -= dx * this.fpv.lookSensitivity
      this.fpv.pitch -= dy * this.fpv.lookSensitivity
      const limit = Math.PI / 2 - 0.01
      this.fpv.pitch = Math.max(-limit, Math.min(limit, this.fpv.pitch))

      e.preventDefault()
    }

    const onTouchEnd = (e) => {
      if (activeTouchId === null) return
      // 触点结束或取消都释放
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null
          dragging = false
          e.preventDefault()
          break
        }
      }
    }

    // 键盘移动
    const onKeyDown = (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': this.fpv.moveForward = true; break
        case 's': this.fpv.moveBackward = true; break
        case 'a': this.fpv.moveLeft = true; break
        case 'd': this.fpv.moveRight = true; break
      }
    }

    const onKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': this.fpv.moveForward = false; break
        case 's': this.fpv.moveBackward = false; break
        case 'a': this.fpv.moveLeft = false; break
        case 'd': this.fpv.moveRight = false; break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    // 移动端触摸事件
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

    // 移动端虚拟摇杆
    this.createJoystick((x, y) => {
      if (this.fpv) {
        this.fpv.joystick.x = x
        this.fpv.joystick.y = y
      }
    })

    this._fpvCleanup = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      this.fpv = null
    }
  }

  updateFirstPerson(dt) {
    if (!this.fpv || !this.camera) return

    // 方向向量（只绕 Y 轴）
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.fpv.yaw)
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.fpv.yaw)

    // 键盘 + 摇杆（摇杆 y 为向上负值，这里取反更符合直觉）
    const joyX = this.fpv.joystick?.x || 0
    const joyY = this.fpv.joystick?.y || 0

    let moveZ = 0
    let moveX = 0

    if (this.fpv.moveForward) moveZ += 1
    if (this.fpv.moveBackward) moveZ -= 1
    if (this.fpv.moveRight) moveX += 1
    if (this.fpv.moveLeft) moveX -= 1

    moveX += joyX
    moveZ += -joyY

    const move = new THREE.Vector3()
    move.addScaledVector(forward, moveZ)
    move.addScaledVector(right, moveX)

    if (move.lengthSq() > 1e-6) {
      move.normalize().multiplyScalar(this.fpv.speed * dt)
      this.camera.position.add(move)
    }

    // 固定人眼高度
    this.camera.position.y = this.fpv.height

    // 应用视角（yaw/pitch）
    const euler = new THREE.Euler(this.fpv.pitch, this.fpv.yaw, 0, 'YXZ')
    this.camera.quaternion.setFromEuler(euler)
  }

  updateThirdPerson(dt) {
    if (!this.tpv || !this.camera) return

    const { avatar } = this.tpv

    // 计算移动方向（基于 yaw）
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tpv.yaw)
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tpv.yaw)

    const joyX = this.tpv.joystick?.x || 0
    const joyY = this.tpv.joystick?.y || 0

    let moveZ = 0
    let moveX = 0

    if (this.tpv.moveForward) moveZ += 1
    if (this.tpv.moveBackward) moveZ -= 1
    if (this.tpv.moveRight) moveX += 1
    if (this.tpv.moveLeft) moveX -= 1

    moveX += joyX
    moveZ += -joyY

    const move = new THREE.Vector3()
    move.addScaledVector(forward, moveZ)
    move.addScaledVector(right, moveX)

    if (move.lengthSq() > 1e-6) {
      move.normalize().multiplyScalar(this.tpv.speed * dt)
      avatar.position.add(move)
    }

    // 角色朝向
    avatar.rotation.y = this.tpv.yaw

    // 相机跟随
    const camOffset = new THREE.Vector3(0, this.tpv.followHeight, this.tpv.followDistance)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tpv.yaw)

    const desired = avatar.position.clone().add(camOffset)
    this.camera.position.lerp(desired, 0.15)
    this.camera.lookAt(avatar.position.x, avatar.position.y + 1.2, avatar.position.z)
  }

  enableThirdPersonMode() {
    if (!this.camera || !this.renderer || !this.scene) return

    // 禁用 orbit
    if (this.controls) this.controls.enabled = false

    // 创建一个占位“角色”
    const geo = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8)
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1, metalness: 0 })
    const avatar = new THREE.Mesh(geo, mat)
    avatar.castShadow = true
    avatar.position.set(0, 0.8, 0)
    avatar.userData.type = 'avatar'
    this.scene.add(avatar)

    this.tpv = {
      avatar,
      speed: 8,
      height: 1.6,
      followDistance: 4,
      followHeight: 2.2,
      yaw: 0,
      joystick: { x: 0, y: 0 },
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false
    }

    // 键盘移动
    const onKeyDown = (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': this.tpv.moveForward = true; break
        case 's': this.tpv.moveBackward = true; break
        case 'a': this.tpv.moveLeft = true; break
        case 'd': this.tpv.moveRight = true; break
      }
    }

    const onKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': this.tpv.moveForward = false; break
        case 's': this.tpv.moveBackward = false; break
        case 'a': this.tpv.moveLeft = false; break
        case 'd': this.tpv.moveRight = false; break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // 右侧拖动改变朝向（简单实现）
    const canvas = this.renderer.domElement
    let dragging = false
    let lastX = 0
    const onMouseDown = (e) => { dragging = true; lastX = e.clientX }
    const onMouseUp = () => { dragging = false }
    const onMouseMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      this.tpv.yaw -= dx * 0.003
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    // 移动端虚拟摇杆
    this.createJoystick((x, y) => {
      if (this.tpv) {
        this.tpv.joystick.x = x
        this.tpv.joystick.y = y
      }
    })

    this._tpvCleanup = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      if (avatar.parent) avatar.parent.remove(avatar)
      geo.dispose()
      mat.dispose()
      this.tpv = null
    }
  }

  createJoystick(onMove) {
    if (!('ontouchstart' in window)) return
    if (!this.container) {
      this.container = document.getElementById('app') || document.body
    }

    const el = document.createElement('div')
    el.style.cssText = `position:fixed;left:20px;bottom:20px;width:120px;height:120px;border-radius:60px;background:rgba(0,0,0,0.2);z-index:9999;touch-action:none;`

    const stick = document.createElement('div')
    stick.style.cssText = `position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:20px;background:rgba(255,255,255,0.6);`
    el.appendChild(stick)

    const radius = 50
    let active = false
    let startX = 0
    let startY = 0

    const setStick = (dx, dy) => {
      const len = Math.hypot(dx, dy)
      const clamped = len > radius ? radius / len : 1
      const x = dx * clamped
      const y = dy * clamped
      stick.style.transform = `translate(${x}px, ${y}px)`
      onMove(x / radius, y / radius)
    }

    const reset = () => {
      stick.style.transform = 'translate(0px, 0px)'
      onMove(0, 0)
    }

    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0]
      active = true
      startX = t.clientX
      startY = t.clientY
      e.preventDefault()
    }, { passive: false })

    el.addEventListener('touchmove', (e) => {
      if (!active) return
      const t = e.touches[0]
      setStick(t.clientX - startX, t.clientY - startY)
      e.preventDefault()
    }, { passive: false })

    el.addEventListener('touchend', (e) => {
      active = false
      reset()
      e.preventDefault()
    }, { passive: false })

    this.container.appendChild(el)
    this.joystickEl = el
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

      // 默认视角模式
      this.setViewMode('orbit')

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
    // 开发阶段：加载本地建筑清单（每个建筑一个 GLB）
    const buildings = [
      { id: 'library', name: '图书馆', url: '/models/library.glb' },
      { id: 'east_gate', name: '东门', url: '/models/east-gate.glb' }
    ]

    const failed = []

    for (const b of buildings) {
      try {
        await this.loadSingleCampusModel(b.url, { id: b.id, name: b.name })
      } catch (error) {
        failed.push({ building: b, error })
        const message = this.formatModelLoadError(error, b.url)
        console.error(message, error)
      }
    }

    if (failed.length > 0) {
      const msg = `部分模型加载失败（已加载 ${buildings.length - failed.length}/${buildings.length}）：\n` + failed.map(f => `- ${f.building.name}: ${f.building.url}`).join('\n')
      this.showError(msg)
    }

    // 如果一个都没加载成功，则回退到示例建筑
    if (this.buildings.size === 0) {
      await this.createSampleBuildings()
    }
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

  async loadSingleCampusModel(url, meta = {}) {
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
      id: meta.id || 'library',
      name: meta.name || '图书馆',
      type: 'building'
    }

    this.scene.add(modelRoot)
    this.buildings.set(modelRoot.userData.id, modelRoot)

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

    const now = performance.now()
    if (!this._lastFrameTime) this._lastFrameTime = now
    const dt = Math.min((now - this._lastFrameTime) / 1000, 0.05)
    this._lastFrameTime = now

    // 模式更新
    if (this.viewMode === 'fpv') {
      this.updateFirstPerson(dt)
    } else if (this.viewMode === 'tpv') {
      this.updateThirdPerson(dt)
    }

    // 更新控制器
    if (this.controls && this.controls.enabled) {
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
