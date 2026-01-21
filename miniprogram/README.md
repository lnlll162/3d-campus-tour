# 微信小程序版本 - 3D校园云旅游

## 📱 概述

基于微信小程序平台的沉浸式3D校园虚拟旅游应用，支持按需加载、LOD渲染和本地缓存。

## 🚀 快速开始

### 环境要求

- 微信开发者工具 1.06.2307260 或以上版本
- Node.js 16.0.0+
- 支持WebGL的微信版本

### 安装依赖

在微信开发者工具的项目根目录中运行：

```bash
npm install
```

### 开发调试

1. 打开微信开发者工具
2. 导入 `miniprogram` 文件夹作为项目
3. 在开发者工具中点击"编译"运行
4. 使用真机调试获取最佳体验

## 📁 项目结构

```
miniprogram/
├── app.js                 # 小程序入口
├── app.json              # 小程序配置
├── app.wxss              # 全局样式
├── pages/
│   └── index/            # 主页面
│       ├── index.js      # 页面逻辑
│       ├── index.wxml    # 页面模板
│       ├── index.wxss    # 页面样式
│       └── index.json    # 页面配置
├── utils/
│   └── campus-loader.js  # 3D场景加载器
├── manifests/            # 场景配置文件
└── project.config.json   # 项目配置
```

## 🛠️ 核心功能

### 3D渲染引擎
- 使用 `three-miniprogram` 在小程序中运行 Three.js
- WebGL硬件加速渲染
- 支持PBR材质和阴影

### 智能加载系统
- **Manifest驱动**: 基于JSON配置管理场景
- **按需下载**: 根据用户位置动态加载模型
- **本地缓存**: 自动缓存已下载模型，支持版本校验
- **LOD系统**: 根据距离自动切换模型细节级别

### 用户交互
- 触屏手势控制（拖拽旋转、缩放）
- 实时渲染循环（目标60FPS）
- 信息面板和导航控制

## 🔧 配置说明

### Manifest格式

场景配置文件位于 `manifests/campus_manifest.json`：

```json
{
  "version": "1.0",
  "regions": [
    {
      "id": "main_gate",
      "name": "主校门",
      "bbox": [-10, 0, -10, 10, 10, 10],
      "priority": 1,
      "platform": ["web", "miniprogram"],
      "lod": {
        "lod0": {"download_url": "...", "version": "1.0"},
        "lod1": {"download_url": "...", "version": "1.0"},
        "lod2": {"download_url": "...", "version": "1.0"}
      }
    }
  ]
}
```

### 模型要求

- **格式**: GLB/GLTF
- **压缩**: 支持Draco几何压缩和KTX2纹理压缩
- **Anchor点**: 每个模型必须包含名为 `anchor_origin` 的节点用于位置对齐
- **坐标系**: 右手坐标系，Y轴向上，单位为米

## 📊 性能优化

### 加载策略
- 首次加载: < 3秒
- 模型大小: 单个建筑 < 5MB
- 帧率: 稳定 60 FPS
- 内存: < 100MB

### 缓存机制
- 自动检测模型版本更新
- 本地文件系统缓存
- 下载进度显示和错误重试

## 🐛 故障排除

### 常见问题

1. **Three.js加载失败**
   - 确保已运行 `npm install`
   - 检查微信开发者工具版本

2. **模型下载失败**
   - 检查网络连接
   - 验证CDN地址是否可访问

3. **渲染性能问题**
   - 降低模型复杂度
   - 调整LOD切换距离

### 调试技巧

- 使用微信开发者工具的"调试"面板查看控制台日志
- 在真机上测试获取准确的性能数据
- 使用 `wx.getSystemInfoSync()` 检查设备WebGL支持

## 🔄 开发工作流

1. **本地开发**: 在微信开发者工具中修改代码
2. **真机测试**: 使用微信开发者工具的真机调试
3. **性能测试**: 在不同设备上测试加载时间和帧率
4. **提审发布**: 按照微信小程序审核规范提交

## 📚 相关文档

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/)
- [Three.js官方文档](https://threejs.org/docs/)
- [WebGL规范](https://www.khronos.org/webgl/)

## 🤝 贡献指南

1. 遵循现有的代码规范
2. 添加必要的注释和文档
3. 测试在不同设备上的兼容性
4. 提交PR时请详细描述更改内容

---

*如有问题，请查看项目主README或提交Issue*
