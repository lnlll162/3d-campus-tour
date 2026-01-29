import { DirectionalLight, AmbientLight, HemisphereLight, PointLight, SpotLight } from 'three'

/**
 * 光照系统
 * 管理场景中的各种光源，提供动态光照控制
 */
export class LightingSystem {
  constructor(scene) {
    this.scene = scene
    this.lights = {
      ambient: null,
      hemisphere: null,
      directional: [],
      point: [],
      spot: []
    }

    this.time = 0
    this.isDayTime = true

    // 初始化基础光照
    this.setupBasicLighting()
  }

  /**
   * 设置基础光照
   */
  setupBasicLighting() {
    // 环境光 - 提供基础亮度
    this.lights.ambient = new AmbientLight(0x404040, 0.4)
    this.scene.add(this.lights.ambient)

    // 半球光 - 模拟天空光
    this.lights.hemisphere = new HemisphereLight(0x87CEEB, 0x8B4513, 0.6)
    this.lights.hemisphere.position.set(0, 50, 0)
    this.scene.add(this.lights.hemisphere)

    // 主方向光 - 模拟阳光
    const mainLight = new DirectionalLight(0xffffff, 1.0)
    mainLight.position.set(50, 50, 25)
    mainLight.castShadow = true

    // 配置阴影
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 500
    mainLight.shadow.camera.left = -100
    mainLight.shadow.camera.right = 100
    mainLight.shadow.camera.top = 100
    mainLight.shadow.camera.bottom = -100

    this.lights.directional.push(mainLight)
    this.scene.add(mainLight)

    // 次要方向光 - 填充阴影
    const fillLight = new DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-30, 30, -30)
    this.lights.directional.push(fillLight)
    this.scene.add(fillLight)
  }

  /**
   * 添加建筑特定光照
   * @param {Vector3} position - 建筑位置
   * @param {Object} options - 光照选项
   */
  addBuildingLight(position, options = {}) {
    const {
      type = 'point',
      color = 0xffffff,
      intensity = 1.0,
      distance = 20,
      decay = 2
    } = options

    let light

    switch (type) {
      case 'point':
        light = new PointLight(color, intensity, distance, decay)
        light.position.copy(position)
        light.position.y += 10 // 稍微抬高
        this.lights.point.push(light)
        break

      case 'spot':
        light = new SpotLight(color, intensity, distance, Math.PI / 6, 0.5, decay)
        light.position.copy(position)
        light.position.y += 15
        light.target.position.copy(position)
        this.lights.spot.push(light)
        this.scene.add(light.target)
        break
    }

    if (light) {
      light.castShadow = true
      this.scene.add(light)
    }

    return light
  }

  /**
   * 设置昼夜循环
   * @param {boolean} enabled - 是否启用昼夜循环
   */
  setDayNightCycle(enabled = true) {
    this.dayNightCycleEnabled = enabled
  }

  /**
   * 更新昼夜循环
   * @param {number} deltaTime - 时间增量
   */
  updateDayNightCycle(deltaTime) {
    if (!this.dayNightCycleEnabled) return

    this.time += deltaTime

    // 一天24小时 = 24秒循环
    const dayProgress = (this.time % 24) / 24
    const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2 // 从日出开始

    // 更新主光源位置
    const mainLight = this.lights.directional[0]
    if (mainLight) {
      const radius = 100
      const height = Math.sin(sunAngle) * 50

      mainLight.position.x = Math.cos(sunAngle) * radius
      mainLight.position.y = Math.max(height, -10) // 防止光源掉到地下
      mainLight.position.z = Math.sin(sunAngle) * radius

      // 根据太阳高度调整光照强度
      const intensity = Math.max(0, Math.sin(sunAngle)) * 1.2 + 0.1
      mainLight.intensity = intensity

      // 根据时间调整光照颜色
      if (dayProgress < 0.25 || dayProgress > 0.75) {
        // 黄昏/黎明
        mainLight.color.setHex(0xFF6B35)
      } else {
        // 白天
        mainLight.color.setHex(0xFFFFFF)
      }
    }

    // 更新环境光
    const ambientIntensity = 0.2 + Math.max(0, Math.sin(sunAngle)) * 0.3
    this.lights.ambient.intensity = ambientIntensity

    // 更新半球光
    const skyIntensity = 0.3 + Math.max(0, Math.sin(sunAngle)) * 0.4
    this.lights.hemisphere.intensity = skyIntensity
  }

  /**
   * 设置时间
   * @param {number} hour - 小时 (0-23)
   */
  setTime(hour) {
    this.time = hour
    this.updateDayNightCycle(0) // 立即更新
  }

  /**
   * 获取当前时间状态
   */
  getTimeState() {
    const dayProgress = (this.time % 24) / 24
    const isDay = dayProgress > 0.25 && dayProgress < 0.75

    return {
      hour: this.time % 24,
      dayProgress,
      isDay,
      sunAngle: dayProgress * Math.PI * 2 - Math.PI / 2
    }
  }

  /**
   * 添加天气效果光照
   * @param {string} weather - 天气类型
   */
  setWeatherEffect(weather) {
    switch (weather) {
      case 'rainy':
        // 降低光照强度，添加蓝色调
        this.adjustLightingForWeather(0.6, 0x87CEEB)
        break

      case 'cloudy':
        // 柔和的光照
        this.adjustLightingForWeather(0.7, 0xE6E6FA)
        break

      case 'sunny':
      default:
        // 恢复正常光照
        this.adjustLightingForWeather(1.0, 0xFFFFFF)
        break
    }
  }

  /**
   * 调整天气相关的光照
   */
  adjustLightingForWeather(intensityMultiplier, colorTint) {
    // 调整主光源
    const mainLight = this.lights.directional[0]
    if (mainLight) {
      mainLight.intensity *= intensityMultiplier
      mainLight.color.setHex(colorTint)
    }

    // 调整环境光
    this.lights.ambient.intensity *= intensityMultiplier
    this.lights.hemisphere.intensity *= intensityMultiplier
  }

  /**
   * 切换室内/室外模式
   * @param {boolean} isIndoor - 是否室内
   */
  setIndoorMode(isIndoor) {
    if (isIndoor) {
      // 室内模式：降低自然光，增加人工光
      this.lights.ambient.intensity = 0.6
      this.lights.hemisphere.intensity = 0.2

      this.lights.directional.forEach(light => {
        light.intensity *= 0.3
      })
    } else {
      // 室外模式：恢复自然光
      this.lights.ambient.intensity = 0.4
      this.lights.hemisphere.intensity = 0.6

      this.lights.directional.forEach(light => {
        light.intensity = light === this.lights.directional[0] ? 1.0 : 0.3
      })
    }
  }

  /**
   * 更新光照系统
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime = 0.016) {
    this.updateDayNightCycle(deltaTime)
  }

  /**
   * 获取光照配置
   */
  getLightingConfig() {
    return {
      ambient: {
        color: this.lights.ambient.color.getHex(),
        intensity: this.lights.ambient.intensity
      },
      hemisphere: {
        skyColor: this.lights.hemisphere.color.getHex(),
        groundColor: this.lights.hemisphere.groundColor.getHex(),
        intensity: this.lights.hemisphere.intensity
      },
      directional: this.lights.directional.map(light => ({
        color: light.color.getHex(),
        intensity: light.intensity,
        position: light.position.toArray()
      })),
      timeState: this.getTimeState(),
      dayNightCycleEnabled: this.dayNightCycleEnabled
    }
  }

  /**
   * 设置光照配置
   */
  setLightingConfig(config) {
    if (config.ambient) {
      this.lights.ambient.color.setHex(config.ambient.color)
      this.lights.ambient.intensity = config.ambient.intensity
    }

    if (config.hemisphere) {
      this.lights.hemisphere.color.setHex(config.hemisphere.skyColor)
      this.lights.hemisphere.groundColor.setHex(config.hemisphere.groundColor)
      this.lights.hemisphere.intensity = config.hemisphere.intensity
    }

    if (config.directional) {
      config.directional.forEach((lightConfig, index) => {
        if (this.lights.directional[index]) {
          const light = this.lights.directional[index]
          light.color.setHex(lightConfig.color)
          light.intensity = lightConfig.intensity
          light.position.fromArray(lightConfig.position)
        }
      })
    }

    if (config.timeState) {
      this.setTime(config.timeState.hour)
    }

    if (config.dayNightCycleEnabled !== undefined) {
      this.setDayNightCycle(config.dayNightCycleEnabled)
    }
  }

  /**
   * 清理所有光源
   */
  dispose() {
    Object.values(this.lights).forEach(lightArray => {
      if (Array.isArray(lightArray)) {
        lightArray.forEach(light => {
          if (light.target) {
            this.scene.remove(light.target)
          }
          this.scene.remove(light)
        })
      } else if (lightArray) {
        this.scene.remove(lightArray)
      }
    })

    this.lights = {
      ambient: null,
      hemisphere: null,
      directional: [],
      point: [],
      spot: []
    }
  }
}
