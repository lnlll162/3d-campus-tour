// 小程序环境下的模型下载与本地加载示例（伪代码，需在小程序环境中运行）
// 要求：three-miniprogram / weapp-adapter

const fs = wx.getFileSystemManager();
const DOWNLOAD_DIR = `${wx.env.USER_DATA_PATH}/models`;

async function ensureDir(dir) {
  try {
    fs.accessSync(dir);
  } catch (e) {
    try { fs.mkdirSync(dir); } catch (err) { /* ignore */ }
  }
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const dest = `${DOWNLOAD_DIR}/${filename}`;
    // 如果已存在并且版本匹配，可直接返回本地路径（示例略）
    wx.downloadFile({
      url,
      filePath: dest,
      success(res) {
        if (res.statusCode === 200) resolve(dest);
        else reject(new Error('download failed ' + res.statusCode));
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

async function loadModelFromLocal(gltfLoader, localPath) {
  // three-miniprogram 的 GLTFLoader 支持传入本地路径
  return new Promise((resolve, reject) => {
    gltfLoader.load(localPath, (gltf) => resolve(gltf), undefined, reject);
  });
}

// 使用示例：
// 1. ensureDir(DOWNLOAD_DIR)
// 2. await downloadFile(region.lod.lod2.download_url, 'library_lod2.glb')
// 3. await loadModelFromLocal(gltfLoader, localPath)


