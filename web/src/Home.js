export class HomePage {
  constructor({ onEnterCampus, onOpenPanorama } = {}) {
    this.onEnterCampus = onEnterCampus
    this.onOpenPanorama = onOpenPanorama
    this.root = null
  }

  mount(container) {
    this.root = document.createElement('div')
    this.root.className = 'home'
    this.root.innerHTML = `
      <div class="home-header">
        <div class="home-header-inner">
          <div class="home-brand">
            <div class="home-logo"></div>
            <div class="home-titles">
              <div class="home-title">TJU 元宇宙</div>
              <div class="home-subtitle">TJU 校园元宇宙 · 数字孪生导览</div>
            </div>
          </div>
          <div class="home-nav">
            <button class="home-nav-link" data-action="about">学校官网</button>
            <button class="home-nav-link primary" data-action="enter">进入 TJU 3D校园</button>
          </div>
        </div>
      </div>

      <div class="home-content">
        <div class="home-hero">
          <div>
            <div class="home-hero-kicker">TJU 元宇宙</div>
            <div class="home-hero-heading">TJU 元宇宙</div>
            <div class="home-hero-desc">探索数字孪生校园，开启沉浸式导览体验</div>
            <div class="home-hero-actions">
              <button class="home-primary" data-action="enter">进入 TJU 3D校园</button>
              <button class="home-secondary" data-action="about">访问学校官网</button>
            </div>
          </div>
          <div class="home-hero-side">
            <div class="home-hero-side-title">快速入口</div>
            <div class="home-hero-side-item">- 3D 校园：沉浸式浏览建筑与场景</div>
            <div class="home-hero-side-item">- 720° 全景：校园全景地图（720yun）</div>
            <div class="home-hero-side-item">- 导览服务：按区域/建筑快速查看</div>
            <div class="home-hero-side-item">- 校园资讯：通知公告与活动信息</div>
          </div>
        </div>

        <div class="home-grid">
          <button class="home-tile" data-action="enter">
            <div class="home-tile-title">进入 TJU 3D校园</div>
            <div class="home-tile-desc">沉浸式浏览建筑与场景</div>
          </button>
          <button class="home-tile" data-action="pano">
            <div class="home-tile-title">720° 全景导览</div>
            <div class="home-tile-desc">校园全景地图（720yun）</div>
          </button>
          <button class="home-tile" data-action="map">
            <div class="home-tile-title">校园导览</div>
            <div class="home-tile-desc">按区域/建筑快速查看</div>
          </button>
          <button class="home-tile" data-action="notice">
            <div class="home-tile-title">通知公告</div>
            <div class="home-tile-desc">学校资讯与活动信息</div>
          </button>
        </div>
      </div>

      <div class="home-footer">
        <div class="home-footer-text">© TJU 元宇宙</div>
      </div>
    `

    container.appendChild(this.root)

    this.root.addEventListener('click', (e) => {
      const target = e.target?.closest?.('[data-action]')
      if (!target) return
      const action = target.getAttribute('data-action')

      if (action === 'enter') {
        if (this.onEnterCampus) this.onEnterCampus()
        return
      }

      if (action === 'pano') {
        if (this.onOpenPanorama) this.onOpenPanorama()
        return
      }

      if (action === 'about') {
        window.open('https://www.tjcu.edu.cn/', '_blank')
        return
      }

      // 预留：后续可以在这里做二级页面/弹层
      if (action === 'map' || action === 'notice' || action === 'contact') {
        // 暂时提示
        // eslint-disable-next-line no-alert
        alert('该模块待接入内容')
      }
    })
  }

  unmount() {
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root)
    }
    this.root = null
  }
}
