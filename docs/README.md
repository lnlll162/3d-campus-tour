# 文档索引（docs/）

本目录用于收纳项目的关键文档，建议从本页开始阅读。

## 目录

- [资产管理与模型发布策略](./asset_strategy.md)
  - 模型拆分（每栋建筑一个 GLB）
  - LOD（LOD0/LOD1/LOD2）
  - Draco / KTX2 压缩与托管
  - manifest 设计建议

- [微信小程序 web-view 集成与调试指南](./wechat-webview-integration.md)
  - DevTools 如何切换到 web-view 上下文查看 H5 日志
  - 常见资源 404 / CORS / GLTF 解析错误排查
  - 本地开发与真机差异

- [故障排除指南](./troubleshooting.md)
  - Node.js / Vite 版本兼容问题
  - 常见启动失败原因与解决方案

- [部署指南](../DEPLOYMENT.md)
  - 国内 OSS/COS + CDN（HTTPS）托管 H5
  - 微信公众平台配置 web-view 业务域名
  - 小程序切换 `h5Urls.trial/release` 到国内 HTTPS 域名

- [当前进度与后续步骤](./PROGRESS_AND_NEXT_STEPS.md)
  - 已完成事项
  - 短期/中期任务列表
  - 推荐工具链与命令
