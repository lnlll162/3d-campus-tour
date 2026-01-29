import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Vector3, Spherical } from 'three'

/**
 * 相机控制器
 * 提供相机控制、动画和约束功能
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera
    this.domElement = domElement

    // 初始化轨道控制器
    this.controls = new OrbitControls(camera, domElement)
    this.setupControls()

    // 相机状态
    this.isAnimating = false
    this.animationQueue = []

    // 约束参数
    this.constraints = {
      minDistance: 5,
      maxDistance: 500,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI / 2,
      enableDamping: true,
      dampingFactor: 0.05
    }

    this.applyConstraints()
  }

  /**
   * 配置控制器参数
   */
  setupControls() {
    // 基础设置
    this.controls.enablePan = true
    this.controls.enableZoom = true
    this.controls.enableRotate = true

    // 平滑阻尼
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05

    // 旋转限制
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = Math.PI / 2

    // 缩放限制
    this.controls.minDistance = 5
    this.controls.maxDistance = 500

    // 事件监听
    this.controls.addEventListener('change', this.onCameraChange.bind(this))
    this.controls.addEventListener('end', this.onCameraEnd.bind(this))
  }

  /**
   * 应用约束
   */
  applyConstraints(constraints = {}) {
    Object.assign(this.constraints, constraints)

    this.controls.minDistance = this.constraints.minDistance
    this.controls.maxDistance = this.constraints.maxDistance
    this.controls.minPolarAngle = this.constraints.minPolarAngle
    this.controls.maxPolarAngle = this.constraints.maxPolarAngle
    this.controls.enableDamping = this.constraints.enableDamping
    this.controls.dampingFactor = this.constraints.dampingFactor
  }

  /**
   * 更新控制器
   */
  update() {
    if (this.controls) {
      this.controls.update()
    }

    // 执行相机动画
    this.updateAnimation()
  }

  /**
   * 相机位置变化事件
   */
  onCameraChange() {
    // 发送相机位置到小程序
    if (window.parent && window.parent.postMessage) {
      const position = this.camera.position
      const target = this.controls.target

      window.parent.postMessage({
        type: 'camera_position',
        data: {
          position: { x: position.x, y: position.y, z: position.z },
          target: { x: target.x, y: target.y, z: target.z }
        }
      }, '*')
    }
  }

  /**
   * 相机控制结束事件
   */
  onCameraEnd() {
    // 可以在这里处理控制结束后的逻辑
  }

  /**
   * 平滑移动相机到指定位置
   * @param {Vector3} position - 目标位置
   * @param {Vector3} target - 目标朝向
   * @param {number} duration - 动画时长(毫秒)
   */
  animateTo(position, target, duration = 1000) {
    const startPosition = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const startTime = Date.now()

    const animation = {
      startPosition,
      endPosition: position.clone(),
      startTarget,
      endTarget: target.clone(),
      duration,
      startTime,
      onComplete: null
    }

    this.animationQueue.push(animation)
    this.isAnimating = true

    return new Promise((resolve) => {
      animation.onComplete = resolve
    })
  }

  /**
   * 围绕建筑旋转
   * @param {Vector3} center - 旋转中心
   * @param {number} radius - 旋转半径
   * @param {number} duration - 旋转一周的时间(毫秒)
   */
  orbitAround(center, radius = 50, duration = 10000) {
    const startAngle = Math.atan2(
      this.camera.position.z - center.z,
      this.camera.position.x - center.x
    )

    let lastTime = Date.now()
    let currentAngle = startAngle

    const animate = () => {
      if (!this.isOrbiting) return

      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now

      // 计算新的角度
      currentAngle += (deltaTime / duration) * Math.PI * 2

      // 计算新的相机位置
      const x = center.x + Math.cos(currentAngle) * radius
      const z = center.z + Math.sin(currentAngle) * radius
      const y = this.camera.position.y

      this.camera.position.set(x, y, z)
      this.controls.target.copy(center)
      this.controls.update()

      requestAnimationFrame(animate)
    }

    this.isOrbiting = true
    animate()
  }

  /**
   * 停止旋转
   */
  stopOrbit() {
    this.isOrbiting = false
  }

  /**
   * 聚焦到建筑
   * @param {Object3D} building - 建筑对象
   * @param {number} distance - 距离建筑的距离
   */
  focusOnBuilding(building, distance = 30) {
    // 计算建筑的包围盒中心
    const box = new THREE.Box3().setFromObject(building)
    const center = box.getCenter(new Vector3())

    // 计算合适的相机位置
    const direction = new Vector3(1, 0.5, 1).normalize()
    const position = center.clone().add(direction.multiplyScalar(distance))

    // 设置相机朝向建筑中心稍微上方
    const target = center.clone()
    target.y += 5

    return this.animateTo(position, target, 1500)
  }

  /**
   * 重置相机到初始位置
   */
  resetToInitial(initialPosition, initialTarget) {
    return this.animateTo(initialPosition, initialTarget, 1000)
  }

  /**
   * 更新动画
   */
  updateAnimation() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false
      return
    }

    const animation = this.animationQueue[0]
    const elapsed = Date.now() - animation.startTime
    const progress = Math.min(elapsed / animation.duration, 1)

    // 使用缓动函数
    const easedProgress = this.easeInOutCubic(progress)

    // 插值位置和目标
    const currentPosition = animation.startPosition.clone().lerp(animation.endPosition, easedProgress)
    const currentTarget = animation.startTarget.clone().lerp(animation.endTarget, easedProgress)

    this.camera.position.copy(currentPosition)
    this.controls.target.copy(currentTarget)
    this.controls.update()

    if (progress >= 1) {
      // 动画完成
      this.animationQueue.shift()
      if (animation.onComplete) {
        animation.onComplete()
      }
    }
  }

  /**
   * 缓动函数 - 立方缓入缓出
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * 销毁控制器
   */
  dispose() {
    if (this.controls) {
      this.controls.dispose()
    }
    this.stopOrbit()
    this.animationQueue = []
  }

  /**
   * 获取相机状态
   */
  getState() {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      zoom: this.camera.zoom,
      isAnimating: this.isAnimating,
      isOrbiting: this.isOrbiting || false
    }
  }

  /**
   * 设置相机状态
   */
  setState(state) {
    if (state.position) {
      this.camera.position.copy(state.position)
    }
    if (state.target) {
      this.controls.target.copy(state.target)
    }
    if (state.zoom) {
      this.camera.zoom = state.zoom
    }
    this.controls.update()
  }
}
