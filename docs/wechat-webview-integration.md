# WeChat 小程序 web-view 集成与调试指南

本文档总结了在微信小程序中通过 `web-view` 嵌入 H5 页面时常见的约束、调试方法、模型（GLB/GLTF）加载注意事项、SharedArrayBuffer 的处理方案，以及小程序端推荐替代 API。目标是帮助团队快速定位问题并能在开发与上线环境中稳定运行 3D 场景。

---

## 1. 背景与目标
- 场景：使用 Vite + Three.js 在 `web/` 目录开发 H5 3D 应用，并通过小程序的 `<web-view>` 加载到小程序里（H5-first）。
- 目标：确保在微信开发者工具和真机环境中能正确加载并渲染 `.glb/.gltf` 模型，且可调试 H5 页面日志。

## 2. web-view 的运行与调试方法

1. 在微信开发者工具中打开小程序页面（例如 `pages/campus/campus`）。
2. 右侧面板选择 **调试器 (Debugger)** → 子页签 **Console**。
3. **切换上下文（最关键）**：Console 左上有上下文选择器（`top` / `appservice` 等），选择对应的 web-view 上下文，通常为 `127.0.0.1:5173`、`http://localhost:5173` 或含 `index.html` 的条目。若未直接显示，展开 `Page` / `(no domain)` / `Filesystem` 分组查找。
4. 选中后刷新模拟器页面，H5 的 console 输出将显示在该上下文下。
5. 若需查看资源请求，切换到 **Network**，过滤 `.glb` 或 `models`，检查返回码与响应头。
6. 要查看脚本并设断点，打开 **Sources**，在对应 `127.0.0.1:5173` 下找到 `CampusScene.js` / `BuildingLoader.js` 等文件。

提示：
- 如果在微信开发者工具看不到想要的上下文或日志，可以在浏览器（Chrome）直接打开 `http://localhost:5173`，使用 Chrome DevTools 查看更完整的 Console/Network/Source。

## 3. 模型加载注意事项（GLB/GLTF）

- 路径与静态资源：Vite 的 `public` 目录或项目根下 `web/models` 通常可直接通过 `/models/xxx.glb` 访问。确保 `modelUrl` 与文件实际位置一致。
- 常见错误与排查：
  - 404：路径不对。检查 `modelUrl` 是否以 `/models/...` 开头，与 `web/` 目录下的结构对应。
  - CORS / blocked：开发时 web-view 与 dev server 端口/域可能导致跨域，优先在本机用 Chrome 验证；线上需保证资源同源或设置正确的跨域策略。
  - GLTF parse error：模型损坏或导出不兼容（尝试在 https://gltf-viewer.donmccurdy.com/ 本地查看）。
- Three.js 建议：
  - 在 `GLTFLoader` 的 onError 中打印完整错误。
  - 在加载前确保 `DRACOLoader` / `KTX2Loader` 的路径与版本正确（CDN 或本地）。
  - 对大模型使用进度回调，避免界面无响应。

## 4. SharedArrayBuffer / cross-origin-isolation

- 日志示例：
  - `[Deprecation] SharedArrayBuffer will require cross-origin isolation as of M92...`
- 含义：浏览器为安全原因要求启用 cross-origin isolation 才能使用 `SharedArrayBuffer`（涉及高精度计时 / 多线程共享内存 / 部分 WASM 用例）。
- 解决方式（生产环境）：
 1. 在服务端启用并返回下列响应头（仅在你控制 CDN/服务器时可行）：
    - `Cross-Origin-Opener-Policy: same-origin`
    - `Cross-Origin-Embedder-Policy: require-corp`
 2. 确保被嵌入的第三方资源也可被同源策略或带 `Cross-Origin-Resource-Policy/Corp` 支持，否则会被阻止。
 3. 使用 HTTPS（生产环境）。
- 开发与小程序调试注意：
  - 微信开发者工具的内置 web-view 在本地开发时通常不会严格强制这些头，但真机/浏览器上线环境需要正确配置。
  - 如果项目依赖 worker/WASM 并必须使用 SharedArrayBuffer，可在部署阶段配置服务器头；若不可行，考虑临时移除多线程依赖或用消息传递替代。

## 5. 小程序宿主（推荐替代 API）

- `wx.getSystemInfoSync` 已被标记为 deprecated，推荐使用下列替代：
  - `wx.getDeviceInfo()` — 获取设备信息（含 HarmonyOS 增强）
  - `wx.getWindowInfo()` — 获取窗口尺寸/安全区域
  - `wx.getAppBaseInfo()` — 获取小程序基础信息
  - `wx.getSystemSetting()` / `wx.getAppAuthorizeSetting()` — 获取授权与系统设置
- 在 `campus.js` 等小程序容器逻辑中逐步替换 sync API，使用 Promise/回调以避免阻塞。

## 6. 本地开发与真机差异

- 本地（开发者工具）：
  - web-view 指向 `http://localhost:5173` 时，DevTools 能看到 H5 日志（上下文需切换到 dev server）。
  - 部分浏览器安全策略在开发者工具中会放宽，线上/真机行为可能不同。
- 真机/生产：
  - 推荐将 `web/dist` 构建并部署到 HTTPS 的静态托管（CDN），在小程序中使用 `web-view` 指向 HTTPS URL。
  - 若需要 SharedArrayBuffer，请在 CDN/服务器配置 COOP/COEP 头。
  - 开发时可使用“本地覆盖”方便在小程序 web-view 中访问开发服务器（避免 localhost 访问问题）。
    - 在微信开发者工具 Console 中设置（示例）:
      ```js
      // 将本机局域网 IP 填入，示例： http://192.168.1.10:5173
      wx.setStorageSync('localDevHost', 'http://192.168.1.10:5173')
      ```
    - `miniprogram/config/config.js` 会优先读取该 `localDevHost`（仅在 env === 'develop' 时生效），并用于生成 `web-view` 的 `src`。
    - 这是一个安全、无须改代码的开发方法：不用每次修改 `config.js`，只需在本机 DevTools 中设置一次。

## 7. 快速排查清单（遇到 H5 不显示或模型不加载）

1. DevTools Console（切换到 `127.0.0.1:5173`）查看是否有 `✅ 模型加载完成` / `❌ 模型加载失败` 日志。  
2. Network：过滤 `.glb`，确认请求返回 200，或显示 404/blocked。  
3. 在浏览器中直接打开 `http://localhost:5173`，在 Chrome DevTools 验证问题是否仅在小程序中出现。  
4. 检查 `modelUrl` 路径是否正确（示例：`/models/library.glb`）并且文件在 `web/models` 或 `web/public/models`。  
5. 如果依赖 DRACO/KTX，检查 loader 的 decoder/transcoder URL 是否可访问。  
6. 如果发现 SharedArrayBuffer 警告且功能受影响，评估是否需要配置 COOP/COEP 或暂时移除多线程实现。

## 8. 部署 & CI 建议

- 部署到 CDN（HTTPS）后在小程序 `config` 中切换为生产 URL。  
- 在 CI/CD 中自动化打包：`npm run build` → 上传 `web/dist` 到 CDN，并在小程序配置中替换 `web-view` URL。  
- 如果启用 COOP/COEP：在部署说明里记录受影响的第三方资源并确保它们满足 `require-corp` 或启用 CORS。

## 9. 常见命令

```bash
# 启动本地 dev server
cd web
npm install
npm run dev

# 构建生产包
npm run build
```

## 10. 联系与后续
- 我已把本指南写入 `docs/wechat-webview-integration.md`，如需我把其中的“调试步骤”摘成一个短流程卡（便于同学快速查看）我可以再做一个 `docs/quick-checklist.md`。

---  
文档由项目助手自动生成并与团队讨论要点对齐；如需补充真实机型兼容清单或公司 CDN 配置示例，我可以继续完善。


