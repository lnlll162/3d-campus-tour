// 小程序入口文件
App({
  onLaunch: function (options) {
    console.log('3D校园云旅游小程序启动');

    // 初始化全局数据
    this.globalData = {
      version: '1.0.0',
      university: '天津商业大学',
      shortName: '天商',
      manifestUrl: 'https://cdn.tuc.edu.cn/manifests/campus_manifest.json',
      baseDownloadUrl: 'https://cdn.tuc.edu.cn/models/',
      theme: {
        primary: '#003366',
        secondary: '#004080',
        accent: '#1a4f7a',
        gold: '#d4af37'
      }
    };

    // 检查更新
    this.checkUpdate();
  },

  // 检查小程序更新
  checkUpdate: function() {
    try {
      if (typeof wx.getUpdateManager === 'function') {
        const updateManager = wx.getUpdateManager();

        updateManager.onCheckForUpdate((res) => {
          console.log('检查更新结果:', res.hasUpdate);
        });

        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: (res) => {
              if (res.confirm) {
                try { updateManager.applyUpdate(); } catch (e) { console.warn('applyUpdate failed', e); }
              }
            }
          });
        });

        updateManager.onUpdateFailed(() => {
          wx.showToast({
            title: '更新失败',
            icon: 'none'
          });
        });
      } else {
        console.warn('wx.getUpdateManager 不可用，跳过更新检测');
      }
    } catch (err) {
      console.warn('checkUpdate 捕获错误，继续运行:', err);
    }
  },

  onShow: function (options) {
    console.log('小程序显示');
  },

  onHide: function () {
    console.log('小程序隐藏');
  },

  onError: function (msg) {
    console.error('小程序错误:', msg);
  },

  globalData: {}
});
