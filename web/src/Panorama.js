export class PanoramaPage {
  constructor({ onBack } = {}) {
    this.onBack = onBack
    this.root = null
    this.url = 'https://www.720yun.com/t/3c626j8uyns?scene_id=466907'
  }

  mount(container) {
    this.root = document.createElement('div')
    this.root.className = 'pano'
    this.root.innerHTML = `
      <div class="pano-header">
        <div class="pano-header-inner">
          <div class="pano-title">720° 全景导览</div>
          <div class="pano-actions">
            <button class="pano-btn" data-action="back">返回首页</button>
            <a class="pano-btn pano-btn-primary" href="${this.url}" target="_blank" rel="noreferrer">新窗口打开</a>
          </div>
        </div>
      </div>
      <div class="pano-body">
        <iframe class="pano-iframe" src="${this.url}" referrerpolicy="no-referrer" allow="fullscreen; xr-spatial-tracking" allowfullscreen></iframe>
        <div class="pano-tip">
          若小程序内无法显示（第三方站点可能禁止被 iframe 嵌入），请点击右上角“新窗口打开”。
        </div>
      </div>
    `

    container.appendChild(this.root)

    this.root.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-action]')
      if (!btn) return
      const action = btn.getAttribute('data-action')
      if (action === 'back') {
        if (this.onBack) this.onBack()
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
