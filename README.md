# TJU 元宇宙

> **TJU 元宇宙** 是一个以 **Web(H5) 为主** 的校园数字孪生 / 3D 漫游项目：
> - Web 端负责 UI + Three.js 3D 渲染与交互
> - 微信小程序仅作为 **web-view 容器** 与用户入口

## ✨ 功能概览

- **首页门户**：深蓝官网风格首页（校徽 + 新东门图）
- **TJU 3D校园**：Three.js 场景渲染、视角模式、移动端触控操作
- **720° 全景导览**：嵌入/跳转 720yun 全景（受 iframe 限制时提供降级打开方式）

## 📁 目录结构

```
3d-campus-tour/
├── web/                   # Web(H5) 主项目（Vite + Three.js）
│   ├── src/
│   ├── public/
│   │   ├── images/         # 首页素材（校徽/新东门）
│   │   └── models/         # 3D 模型（GLB）
│   └── index.html
├── miniprogram/           # 微信小程序容器（web-view）
│   ├── pages/campus/       # web-view 页面入口
│   └── config/config.js    # H5 URL 配置 / localDevHost
└── docs/                  # 文档索引与专项说明
```

## 🚀 本地开发

### 1) Web(H5)

进入 `web/` 安装依赖并启动：

```bash
cd web
npm install
npm run dev
```

默认会在本机启动 Vite（通常是 `http://localhost:5173`）。

### 2) 小程序（web-view 容器）

- 微信开发者工具导入 `miniprogram/` 目录
- 小程序页面：`pages/campus/campus`
- 小程序会根据 `miniprogram/config/config.js` 的 `getH5Url()` 加载 H5

#### 本地联调（推荐）

在微信开发者工具 Console 设置本地开发地址（用局域网 IP，不要用 localhost）：

```js
wx.setStorageSync('localDevHost', 'http://192.168.x.x:5173')
```

然后重新编译，小程序会加载：

- `http://192.168.x.x:5173/index.html?page=home`

## 🔗 页面路由（URL 参数）

Web 端通过 URL 参数控制页面：

- `?page=home`：门户首页（默认）
- `?page=campus`：进入 TJU 3D校园
- `?page=pano`：720° 全景导览页

> Web 已在 `web/src/main.js` 做了 URL 归一化，避免 `page=home&page=home` 这种重复参数。

## 🖼️ 首页素材

当前首页使用的素材位于：

- `web/public/images/校徽.jpg`
- `web/public/images/新东门.jpg`

如果要替换图片：
- 直接用同名文件替换即可（保持路径不变）

## 📱 小程序注意事项

### web-view 域名白名单

发布/体验版需要在微信公众平台配置：
- **业务域名**（web-view）
- **HTTPS**（建议使用国内可访问的 HTTPS 域名）

### 720yun iframe 限制

第三方站点可能设置 `X-Frame-Options / CSP frame-ancestors`，导致 **iframe 无法嵌入**。
目前项目提供降级方案：
- 在全景页提供“新窗口打开/跳转打开”入口

## 📚 文档

- 文档索引：`docs/README.md`
- web-view 集成与调试：`docs/wechat-webview-integration.md`
- 故障排除：`docs/troubleshooting.md`

---

如需进一步发布/部署（Vercel/国内 OSS+CDN），建议同步更新：
- `miniprogram/config/config.js` 里的 `h5Urls.trial/release`
