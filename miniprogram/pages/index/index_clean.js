// pages/index/index.js
import CampusLoader from '../../utils/campus-loader.js';

// ensure weapp-adapter is loaded early to shim DOM APIs for three when possible
try {
  require('weapp-adapter');
} catch (e) {
  try {
    // fallback to packaged path
    require('../../miniprogram_npm/weapp-adapter/weapp-adapter.js');
  } catch (e2) {
    console.warn('weapp-adapter not available; three may fail in DevTools', e2);
  }
}

// We'll use `threejs-miniprogram`'s createScopedThreejs to create a THREE scoped to the mini-program canvas.
// Initialization of THREE must happen after the canvas node is available (onReady).
let createScopedThreejs = null;
try {
  createScopedThreejs = require('threejs-miniprogram').createScopedThreejs;
} catch (e) {
  // package may not be built yet in DevTools; we'll detect and warn at runtime
  console.warn('threejs-miniprogram not yet available. Run "构建 npm" in DevTools.', e);
}

Page({
  data: {
    loading: true,
    loadingProgress: 0,
    loadingText: '正在初始化...',
    error: null,
    sceneReady: false,
    camera: null,
    renderer: null,
    scene: null,
    loader: null,
    animationId: null,
    fps: 0,
    showInfoPanel: false,
    // 触摸控制相关
    touchStartX: 0,
    touchStartY: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    isRotating: false,
    rotationSpeed: 0.005,
    zoomSpeed: 0.1,
    minZoom: 5,
    maxZoom: 100,
    // 窗口尺寸
    windowWidth: 375,
    windowHeight: 667
  },

  onLoad: function (options) {
    console.log('3D校园页面加载');

    // 获取系统信息设置canvas尺寸
    try {
      const sysInfo = wx.getSystemInfoSync();
      this.setData({
        windowWidth: sysInfo.windowWidth,
        windowHeight: sysInfo.windowHeight
      });
      console.log('DEBUG: 设置canvas尺寸为:', sysInfo.windowWidth, 'x', sysInfo.windowHeight);
    } catch (err) {
      console.warn('获取系统信息失败:', err);
    }

    // defer 3D initialization until onReady (when canvas node exists)
    // 但先尝试在onLoad后立即查找canvas，万一页面渲染更快
    setTimeout(() => {
      console.log('DEBUG: onLoad后500ms尝试查找canvas');
      const query = wx.createSelectorQuery();
      query.select('#webgl').node().exec((res) => {
        console.log('DEBUG: onLoad时canvas查询结果:', res);
        const canvas = res && res[0] && res[0].node;
        if (canvas) {
          console.log('DEBUG: onLoad时找到canvas! 提前初始化3D');
          this.initialize3DWithCanvas(canvas);
        }
      });
    }, 500);
  },

  // 初始化3D环境的核心方法
  initialize3DWithCanvas: function(canvas) {
    console.log('DEBUG: 开始初始化3D环境，canvas:', canvas);

    // 确保createScopedThreejs可用
    if (typeof createScopedThreejs !== 'function') {
      try {
        const pkg = require('threejs-miniprogram');
        if (pkg && typeof pkg.createScopedThreejs === 'function') createScopedThreejs = pkg.createScopedThreejs;
      } catch (err) {
        try {
          const pkg2 = require('miniprogram_npm/threejs-miniprogram/dist/index.js');
          if (pkg2 && typeof pkg2.createScopedThreejs === 'function') createScopedThreejs = pkg2.createScopedThreejs;
        } catch (err2) {
          try {
            const pkg3 = require('../../miniprogram_npm/threejs-miniprogram/dist/index.js');
            if (pkg3 && typeof pkg3.createScopedThreejs === 'function') createScopedThreejs = pkg3.createScopedThreejs;
          } catch (err3) {
            console.warn('threejs-miniprogram createScopedThreejs not found via fallbacks', err, err2, err3);
            return;
          }
        }
      }
    }

    if (typeof createScopedThreejs === 'function') {
      try {
        console.log('DEBUG: 调用createScopedThreejs...');
        const THREE = createScopedThreejs(canvas);
        console.log('DEBUG: createScopedThreejs返回类型:', typeof THREE);

        // 尝试多种方式设置全局THREE
        let globalSetSuccess = false;
        try {
          global.THREE = THREE;
          globalSetSuccess = true;
          console.log('DEBUG: global.THREE设置成功');
        } catch (err) {
          console.warn('DEBUG: global.THREE设置失败:', err.message);
          try {
            wx.THREE = THREE;
            globalSetSuccess = true;
            console.log('DEBUG: wx.THREE设置成功');
          } catch (err2) {
            console.warn('DEBUG: wx.THREE设置失败:', err2.message);
            try {
              getApp().THREE = THREE;
              globalSetSuccess = true;
              console.log('DEBUG: getApp().THREE设置成功');
            } catch (err3) {
              console.warn('DEBUG: getApp().THREE设置失败:', err3.message);
            }
          }
        }

        if (!globalSetSuccess) {
          console.error('DEBUG: 所有全局THREE设置方式都失败了');
        }

        // DEBUG: inspect the created THREE object
        try {
          const keys = Object.keys(THREE || {}).slice(0, 40);
          console.log('DEBUG: scoped THREE keys:', keys);
          console.log('DEBUG: THREE.Scene exists?', !!(THREE && THREE.Scene));
          console.log('DEBUG: THREE.WebGLRenderer exists?', !!(THREE && THREE.WebGLRenderer));
          console.log('DEBUG: THREE.PerspectiveCamera exists?', !!(THREE && THREE.PerspectiveCamera));
        } catch (inspectErr) {
          console.warn('DEBUG: failed to inspect scoped THREE', inspectErr);
        }

        // 初始化3D场景
        this.init3DScene();

      } catch (err) {
        console.warn('createScopedThreejs failed', err && (err.stack || err.message || err));
      }
    } else {
      console.error('createScopedThreejs not available');
    }
  },

  onReady: function () {
    console.log('3D校园页面渲染完成');
    // 开始查找canvas并初始化3D环境
    this.startCanvasLookup();
  },

  // 开始查找canvas的逻辑
  startCanvasLookup: function() {
    console.log('DEBUG: 开始查找canvas节点');

    // DEBUG: log attempts to locate threejs-miniprogram
    try {
      const probe = require('threejs-miniprogram');
      console.log('DEBUG: require("threejs-miniprogram") success, keys=', Object.keys(probe).slice(0,20));
    } catch (probeErr) {
      console.warn('DEBUG: require("threejs-miniprogram") failed:', probeErr && probeErr.message);
    }

    const query = wx.createSelectorQuery();

    const tryFindCanvas = (attemptsLeft) => {
      console.log(`DEBUG: 第${9-attemptsLeft}次尝试查找canvas`);

      // 尝试多种选择器方式查找canvas
      const selectors = [
        '#webgl',           // id选择器 (canvas-id)
        'canvas',           // 标签选择器
        '.webgl-canvas',    // class选择器
        'canvas[canvas-id="webgl"]'  // 属性选择器
      ];

      let foundCanvas = null;
      let usedSelector = '';

      // 依次尝试不同选择器
      const tryNextSelector = (selectorIndex) => {
        if (selectorIndex >= selectors.length) {
          // 所有选择器都尝试完了
          if (foundCanvas) {
            console.log(`DEBUG: 使用选择器 '${usedSelector}' 找到canvas!`);
            console.log('DEBUG: canvas尺寸:', foundCanvas.width, 'x', foundCanvas.height);
            this.initialize3DWithCanvas(foundCanvas);
          } else {
            if (attemptsLeft > 0) {
              console.log('DEBUG: canvas未找到，200ms后重试...');
              setTimeout(() => tryFindCanvas(attemptsLeft - 1), 200);
            } else {
              console.warn('Canvas node not found after all retries and selectors; ensure canvas exists and is visible.');
              this.init3DScene(); // will surface friendly error
            }
          }
          return;
        }

        const selector = selectors[selectorIndex];
        console.log(`DEBUG: 尝试选择器 '${selector}'`);
        query.select(selector).node().exec((res) => {
          console.log(`DEBUG: 选择器 '${selector}' 查询结果:`, res);
          const canvas = res && res[0] && res[0].node;
          if (canvas) {
            foundCanvas = canvas;
            usedSelector = selector;
          }
          tryNextSelector(selectorIndex + 1);
        });
      };

      tryNextSelector(0);
    };

    // 开始查找，尝试8次
    tryFindCanvas(8);
  },

  onShow: function () {
    console.log('3D校园页面显示');
    if (this.data.sceneReady) {
      this.startRenderLoop();
    }
  },

  onHide: function () {
    console.log('3D校园页面隐藏');
    this.stopRenderLoop();
  },

  onUnload: function () {
    console.log('3D校园页面卸载');
    this.cleanup();
  },

  // 初始化3D场景
  async init3DScene() {
    try {
      this.setData({
        loadingText: '正在初始化3D引擎...'
      });

      // 获取 THREE（应该已由 createScopedThreejs 在 onReady 中创建）
      let THREE = null;

      // 尝试多种方式获取THREE
      try { THREE = global.THREE; } catch (e) { /* ignore */ }
      if (!THREE) try { THREE = wx.THREE; } catch (e) { /* ignore */ }
      if (!THREE) try { THREE = getApp().THREE; } catch (e) { /* ignore */ }

      console.log('DEBUG: 获取THREE结果:', THREE ? '成功' : '失败');

      if (!THREE) {
        throw new Error('THREE 未初始化：请在微信开发者工具中运行 "构建 npm" 并确保已安装 threejs-miniprogram。可能的原因：1) createScopedThreejs调用失败 2) 全局对象设置失败 3) 作用域问题');
      }

      console.log('DEBUG: THREE类型:', typeof THREE);
      console.log('DEBUG: THREE有Scene?', !!THREE.Scene);
      console.log('DEBUG: THREE有WebGLRenderer?', !!THREE.WebGLRenderer);

      // 安全地获取系统信息（在某些 devtools / 子上下文中可能返回 null 或抛错）
      const safeGetSystemInfo = () => {
        try {
          const info = wx.getSystemInfoSync();
          if (!info || typeof info.windowWidth !== 'number' || typeof info.windowHeight !== 'number') {
            return { windowWidth: 375, windowHeight: 667 };
          }
          return info;
        } catch (err) {
          // 返回合理的默认值，避免因 devtools 环境中断
          return { windowWidth: 375, windowHeight: 667 };
        }
      };
      const sysInfo = safeGetSystemInfo();

      // 创建场景
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB); // 天蓝色背景

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        75,
        sysInfo.windowWidth / sysInfo.windowHeight,
        0.1,
        1000
      );
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      try {
        renderer.setSize(sysInfo.windowWidth, sysInfo.windowHeight);
      } catch (err) {
        console.warn('renderer.setSize 失败，使用默认尺寸', err);
        renderer.setSize(375, 667);
      }
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      // 添加方向光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // 添加地面
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x90EE90,
        transparent: true,
        opacity: 0.8
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // 保存到页面数据
      this.setData({
        camera: camera,
        renderer: renderer,
        scene: scene
      });

      // 初始化加载器
      this.setData({
        loadingText: '正在初始化加载器...'
      });

      const loader = new CampusLoader(renderer);
      this.setData({
        loader: loader
      });

      // 加载manifest
      await this.loadManifest();

    } catch (error) {
      console.error('初始化3D场景失败:', error);
      this.setData({
        loading: false,
        error: {
          title: '初始化失败',
          message: error.message || '3D场景初始化时发生错误，请重试'
        }
      });
    }
  },

  // 加载manifest
  async loadManifest() {
    try {
      this.setData({
        loadingText: '正在加载场景配置...'
      });

      const manifestUrl = getApp().globalData.manifestUrl;
      await this.data.loader.loadManifest(manifestUrl);

      this.setData({
        loadingText: '正在加载3D模型...'
      });

      // 开始渲染循环
      this.setData({
        sceneReady: true,
        loading: false
      });

      this.startRenderLoop();

      // 模拟加载进度（实际项目中需要根据真实加载进度更新）
      this.simulateLoading();

    } catch (error) {
      console.error('加载manifest失败:', error);
      this.setData({
        loading: false,
        error: {
          title: '加载失败',
          message: '无法加载场景配置，请检查网络连接'
        }
      });
    }
  },

  // 模拟加载进度（用于演示）
  simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        this.setData({
          loadingProgress: progress,
          loadingText: '加载完成'
        });
        setTimeout(() => {
          this.setData({ loading: false });
        }, 500);
      } else {
        this.setData({
          loadingProgress: progress,
          loadingText: `正在加载3D模型... ${Math.round(progress)}%`
        });
      }
    }, 300);
  },

  // 开始渲染循环
  startRenderLoop() {
    if (this.data.animationId) return;

    const animate = () => {
      if (!this.data.sceneReady) return;

      try {
        // 更新FPS
        this.updateFPS();

        // 更新加载器（检查是否需要加载新区域）
        if (this.data.loader) {
          this.data.loader.update(this.data.scene, this.data.camera);
        }

        // 渲染场景
        this.data.renderer.render(this.data.scene, this.data.camera);

        // 继续循环
        this.setData({
          animationId: requestAnimationFrame(animate)
        });
      } catch (error) {
        console.error('渲染循环错误:', error);
        this.stopRenderLoop();
      }
    };

    animate();
  },

  // 停止渲染循环
  stopRenderLoop() {
    if (this.data.animationId) {
      cancelAnimationFrame(this.data.animationId);
      this.setData({
        animationId: null
      });
    }
  },

  // 清理资源
  cleanup() {
    this.stopRenderLoop();

    if (this.data.renderer) {
      this.data.renderer.dispose();
    }

    if (this.data.loader) {
      // 清理加载器资源
    }

    this.setData({
      camera: null,
      renderer: null,
      scene: null,
      loader: null
    });
  },

  // 重试加载
  onRetry: function() {
    this.setData({
      loading: true,
      loadingProgress: 0,
      error: null
    });
    this.init3DScene();
  },

  // 触摸事件处理
  onTouchStart: function(e) {
    if (e.touches.length === 1) {
      // 单指触摸 - 旋转
      const touch = e.touches[0];
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
        lastTouchX: touch.clientX,
        lastTouchY: touch.clientY,
        isRotating: true
      });
    } else if (e.touches.length === 2) {
      // 双指触摸 - 缩放
      this.setData({
        isRotating: false
      });
    }
  },

  onTouchMove: function(e) {
    if (!this.data.camera || !this.data.sceneReady) return;

    if (e.touches.length === 1 && this.data.isRotating) {
      // 单指旋转
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.data.lastTouchX;
      const deltaY = touch.clientY - this.data.lastTouchY;

      // 计算旋转角度
      const rotationY = deltaX * this.data.rotationSpeed;
      const rotationX = deltaY * this.data.rotationSpeed;

      // 应用旋转到相机
      const camera = this.data.camera;
      camera.rotation.y -= rotationY;
      camera.rotation.x -= rotationX;

      // 限制垂直旋转角度
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

      this.setData({
        lastTouchX: touch.clientX,
        lastTouchY: touch.clientY
      });

    } else if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // 这里可以实现缩放逻辑
      // 暂时简化处理
    }
  },

  onTouchEnd: function(e) {
    this.setData({
      isRotating: false
    });
  },

  // 控制按钮事件
  onResetCamera: function() {
    if (!this.data.camera) return;

    const camera = this.data.camera;
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.rotation.set(0, 0, 0);

    wx.showToast({
      title: '视角已重置',
      icon: 'success',
      duration: 1000
    });
  },

  onToggleInfo: function() {
    this.setData({
      showInfoPanel: !this.data.showInfoPanel
    });
  },

  onCloseInfo: function() {
    this.setData({
      showInfoPanel: false
    });
  },

  onShare: function() {
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  // FPS计算（可选）
  updateFPS: function() {
    if (!this.fpsLastTime) {
      this.fpsLastTime = Date.now();
      this.frameCount = 0;
      return;
    }

    this.frameCount++;
    const now = Date.now();
    const delta = now - this.fpsLastTime;

    if (delta >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / delta);
      this.setData({ fps: fps });
      this.fpsLastTime = now;
      this.frameCount = 0;
    }
  },

  // 分享功能
  onShareAppMessage: function () {
    return {
      title: '3D校园云旅游 - 沉浸式虚拟校园体验',
      path: '/pages/index/index'
    };
  }
});
