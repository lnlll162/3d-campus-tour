// 小程序环境下的校园3D场景加载器
// 基于three-miniprogram/weapp-adapter

class CampusLoader {
  constructor(renderer) {
    this.renderer = renderer;
    this.manager = null;
    this.gltfLoader = null;
    this.dracoLoader = null;
    this.ktx2Loader = null;
    this.manifest = null;
    this.loadedRegions = new Map(); // id -> scene group
    this.downloadingModels = new Map(); // url -> Promise
    this.fs = wx.getFileSystemManager();
    this.DOWNLOAD_DIR = `${wx.env.USER_DATA_PATH}/models`;

    this.initLoaders();
    this.ensureDownloadDir();
  }

  // 初始化Three.js加载器
  initLoaders() {
    try {
      // Prefer global.THREE created by createScopedThreejs (threejs-miniprogram).
      let THREE = (typeof global !== 'undefined' && global.THREE) ? global.THREE : null;
      if (!THREE) {
        // try three-miniprogram then fallback to three
        try {
          THREE = require('three-miniprogram');
        } catch (err) {
          try {
            THREE = require('three');
            console.warn('CampusLoader: fallback to `three` package in devtools.');
          } catch (err2) {
            console.error('CampusLoader: no three runtime available. Install threejs-miniprogram or three.', err2);
            throw err2;
          }
        }
      }

      // 创建加载管理器
      this.manager = THREE.LoadingManager ? new THREE.LoadingManager() : new THREE.LoadingManager();

      // Draco解码器路径（如果使用压缩）
      this.dracoLoader = THREE.DRACOLoader ? new THREE.DRACOLoader() : null;
      this.dracoLoader.setDecoderPath('/draco/');
      this.dracoLoader.preload();

      // KTX2纹理加载器
      this.ktx2Loader = THREE.KTX2Loader ? new THREE.KTX2Loader().setTranscoderPath('/basis/') : null;
      if (this.ktx2Loader && this.renderer && this.ktx2Loader.detectSupport) this.ktx2Loader.detectSupport(this.renderer);

      // GLTF加载器
      this.gltfLoader = THREE.GLTFLoader ? new THREE.GLTFLoader(this.manager) : null;
      if (this.gltfLoader && this.gltfLoader.setDRACOLoader) this.gltfLoader.setDRACOLoader(this.dracoLoader);
      if (this.gltfLoader && this.gltfLoader.setKTX2Loader) this.gltfLoader.setKTX2Loader(this.ktx2Loader);

    } catch (error) {
      console.error('初始化加载器失败:', error);
      throw new Error('Three.js加载器初始化失败，请确保已安装three-miniprogram');
    }
  }

  // 确保下载目录存在
  ensureDownloadDir() {
    try {
      this.fs.accessSync(this.DOWNLOAD_DIR);
    } catch (e) {
      try {
        this.fs.mkdirSync(this.DOWNLOAD_DIR, true);
        console.log('创建下载目录:', this.DOWNLOAD_DIR);
      } catch (err) {
        console.error('创建下载目录失败:', err);
      }
    }
  }

  // 下载manifest
  async loadManifest(url) {
    try {
      console.log('开始下载manifest:', url);

      const res = await this.request(url);
      this.manifest = JSON.parse(res.data);

      console.log('Manifest加载成功:', this.manifest.version);
      return this.manifest;

    } catch (error) {
      console.error('Manifest加载失败:', error);
      throw new Error('无法加载场景配置文件');
    }
  }

  // 网络请求封装
  request(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        },
        fail: reject
      });
    });
  }

  // 下载模型文件到本地
  async downloadModel(url, filename, onProgress) {
    const cacheKey = `${url}_${filename}`;

    // 检查是否正在下载
    if (this.downloadingModels.has(cacheKey)) {
      return this.downloadingModels.get(cacheKey);
    }

    // 检查本地是否已存在且版本匹配
    const localPath = `${this.DOWNLOAD_DIR}/${filename}`;
    if (this.isModelCached(localPath, url)) {
      console.log('使用缓存的模型:', filename);
      return Promise.resolve(localPath);
    }

    // 开始下载
    const downloadPromise = this.performDownload(url, filename, localPath, onProgress);
    this.downloadingModels.set(cacheKey, downloadPromise);

    try {
      const result = await downloadPromise;
      this.downloadingModels.delete(cacheKey);
      return result;
    } catch (error) {
      this.downloadingModels.delete(cacheKey);
      throw error;
    }
  }

  // 执行下载
  performDownload(url, filename, localPath, onProgress) {
    return new Promise((resolve, reject) => {
      console.log('开始下载模型:', filename);

      const downloadTask = wx.downloadFile({
        url: url,
        filePath: localPath,
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('模型下载成功:', filename);
            // 保存下载记录
            this.saveDownloadRecord(localPath, url);
            resolve(localPath);
          } else {
            reject(new Error(`下载失败: HTTP ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('模型下载失败:', filename, error);
          reject(error);
        }
      });

      // 进度回调
      if (onProgress) {
        downloadTask.onProgressUpdate((res) => {
          onProgress(res.progress / 100);
        });
      }
    });
  }

  // 检查模型是否已缓存
  isModelCached(localPath, url) {
    try {
      // 检查文件是否存在
      this.fs.accessSync(localPath);

      // 检查版本（这里可以扩展为检查哈希值）
      const record = this.getDownloadRecord(url);
      return record && record.path === localPath;

    } catch (e) {
      return false;
    }
  }

  // 保存下载记录
  saveDownloadRecord(localPath, url) {
    try {
      const records = this.getAllDownloadRecords();
      records[url] = {
        path: localPath,
        timestamp: Date.now(),
        url: url
      };
      wx.setStorageSync('model_download_records', records);
    } catch (error) {
      console.warn('保存下载记录失败:', error);
    }
  }

  // 获取下载记录
  getDownloadRecord(url) {
    const records = this.getAllDownloadRecords();
    return records[url];
  }

  // 获取所有下载记录
  getAllDownloadRecords() {
    try {
      return wx.getStorageSync('model_download_records') || {};
    } catch (error) {
      return {};
    }
  }

  // 从本地路径加载GLTF模型
  loadModelFromLocal(localPath, onProgress) {
    return new Promise((resolve, reject) => {
      console.log('开始加载本地模型:', localPath);

      this.gltfLoader.load(
        localPath,
        (gltf) => {
          console.log('模型加载成功:', localPath);
          resolve(gltf);
        },
        (progress) => {
          if (onProgress && progress.lengthComputable) {
            onProgress(progress.loaded / progress.total);
          }
        },
        (error) => {
          console.error('模型加载失败:', localPath, error);
          reject(new Error(`模型加载失败: ${error.message}`));
        }
      );
    });
  }

  // 检查区域是否需要加载（基于相机位置）
  regionNeedsLoading(region, cameraPosition) {
    if (!cameraPosition) return false;

    const [minX, minY, minZ, maxX, maxY, maxZ] = region.bbox;
    const x = cameraPosition.x, y = cameraPosition.y, z = cameraPosition.z;

    // 简单的AABB检查（可以扩展为距离检查）
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  }

  // 加载区域（支持LOD）
  async loadRegion(region, scene, camera, onProgress) {
    const regionId = region.id;

    if (this.loadedRegions.has(regionId)) {
      return this.loadedRegions.get(regionId);
    }

    console.log('开始加载区域:', regionId);

    const group = new THREE.Group();
    group.name = regionId;
    scene.add(group);
    this.loadedRegions.set(regionId, group);

    try {
      // 根据距离选择LOD级别（简化版）
      const lod = this.selectLOD(region, camera);

      if (lod) {
        const localPath = await this.downloadModel(
          lod.download_url,
          `${regionId}_${lod.level}.glb`,
          (progress) => {
            if (onProgress) onProgress(progress * 0.7); // 下载占70%
          }
        );

        const gltf = await this.loadModelFromLocal(localPath, (progress) => {
          if (onProgress) onProgress(0.7 + progress * 0.3); // 加载占30%
        });

        // 查找并对齐anchor点
        this.alignModelByAnchor(gltf.scene, region);

        group.add(gltf.scene);
        console.log('区域加载完成:', regionId);
      }

      return group;

    } catch (error) {
      console.error('区域加载失败:', regionId, error);
      scene.remove(group);
      this.loadedRegions.delete(regionId);
      throw error;
    }
  }

  // 选择LOD级别（基于距离）
  selectLOD(region, camera) {
    if (!camera || !region.lod) return null;

    const distance = this.getDistanceToRegion(region, camera.position);

    // LOD选择逻辑（可以根据实际需求调整）
    if (distance < 20) return region.lod.lod0;
    if (distance < 50) return region.lod.lod1;
    return region.lod.lod2;
  }

  // 计算到区域的距离
  getDistanceToRegion(region, position) {
    const [minX, minY, minZ, maxX, maxY, maxZ] = region.bbox;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const dx = position.x - centerX;
    const dz = position.z - centerZ;

    return Math.sqrt(dx * dx + dz * dz);
  }

  // 根据anchor点对齐模型
  alignModelByAnchor(modelScene, region) {
    // 查找anchor节点
    const anchor = modelScene.getObjectByName('anchor_origin');
    if (anchor) {
      // 计算偏移并应用
      const offset = new THREE.Vector3();
      anchor.getWorldPosition(offset);
      modelScene.position.sub(offset);
      console.log('模型已根据anchor对齐');
    } else {
      console.warn('未找到anchor_origin节点，使用默认位置');
    }
  }

  // 更新加载器（每帧调用）
  async update(scene, camera, onRegionLoad) {
    if (!this.manifest || !camera) return;

    const camPos = camera.position;

    for (const region of this.manifest.regions) {
      if (this.regionNeedsLoading(region, camPos)) {
        if (!this.loadedRegions.has(region.id)) {
          try {
            await this.loadRegion(region, scene, camera);
            if (onRegionLoad) onRegionLoad(region);
          } catch (error) {
            console.error('区域加载失败:', region.id, error);
          }
        }
      } else {
        // 可选：卸载远距离区域
        // this.unloadRegion(region.id, scene);
      }
    }
  }

  // 卸载区域
  unloadRegion(regionId, scene) {
    if (this.loadedRegions.has(regionId)) {
      const group = this.loadedRegions.get(regionId);
      scene.remove(group);
      // 清理几何体和材质
      group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.loadedRegions.delete(regionId);
      console.log('区域已卸载:', regionId);
    }
  }

  // 清理所有资源
  dispose() {
    // 清理加载器
    if (this.gltfLoader) {
      this.gltfLoader = null;
    }

    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }

    if (this.ktx2Loader) {
      this.ktx2Loader.dispose();
    }

    // 清理下载记录（可选）
    this.downloadingModels.clear();
    this.loadedRegions.clear();
  }
}

export default CampusLoader;
