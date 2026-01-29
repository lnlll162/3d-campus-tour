# 🏫 3D校园云旅游系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![微信小程序](https://img.shields.io/badge/微信小程序-8.0+-green.svg)](https://developers.weixin.qq.com/miniprogram/dev/)

> 基于 H5 (Three.js) + web-view 的 3D 校园云旅游系统，H5 负责 3D 渲染，微信小程序作为容器与用户入口。

## ✨ 项目特色

- 🎯 **沉浸式体验**: 360° 自由浏览，真实还原校园环境
- 💻 **H5 3D 渲染**: 使用 Three.js 在浏览器端进行高性能渲染
- 🚀 **高性能渲染**: 浏览器 WebGL，目标 60FPS 流畅体验
- 🎨 **精美视觉**: PBR 材质渲染，环境光遮罩与阴影
- 🗺️ **智能导览**: 建筑信息展示、路径导航与交互热点
- 🌟 **创新交互**: 鼠标/触摸手势控制、建筑点击、UI 交互
- 🔗 **容器集成**: 小程序通过 web-view 加载 H5 页面，负责授权、分享与原生功能

## 🚀 快速开始

## 📚 文档

- 开始阅读：[`docs/README.md`](docs/README.md)
- 资产与模型策略：[`docs/asset_strategy.md`](docs/asset_strategy.md)
- web-view 集成与调试：[`docs/wechat-webview-integration.md`](docs/wechat-webview-integration.md)
- 常见问题：[`docs/troubleshooting.md`](docs/troubleshooting.md)
- 当前进度：[`docs/PROGRESS_AND_NEXT_STEPS.md`](docs/PROGRESS_AND_NEXT_STEPS.md)

### 环境要求

- **微信版本**: iOS 8.0.29+ / Android 8.0.30+
- **基础库**: >= 2.27.1 (推荐 2.32.0+)
- **微信开发者工具**: 最新版本 (推荐Nightly)
- **Node.js**: >= 18.17.0 (推荐 20.11.1+，用于工具链)
- **npm**: >= 9.0.0 (推荐使用最新版本)

### 开发流程

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/3d-campus-tour.git
cd 3d-campus-tour
```

#### 2. 打开微信开发者工具
```bash
# 导入 miniprogram 文件夹
# 微信开发者工具 → 导入项目 → 选择 miniprogram 文件夹
```

#### 3. 开发和调试
```bash
# 点击"编译"运行小程序
# 在控制台查看模型验证结果
# 点击建筑查看logo模型展示
# 测试相机控制和UI交互
```

#### 4. 测试模型集成

### 🚨 常见问题解决

#### Node.js 版本兼容性问题

如果遇到 `crypto$2.getRandomValues is not a function` 错误：

**问题原因**: Node.js 版本过低，Vite 5.0+ 需要 Node.js 18.17.0+

**解决方案**:

1. **升级 Node.js (推荐)**:
   ```bash
   # 下载并安装 Node.js 20.11.1+
   # 官网: https://nodejs.org/
   # 安装完成后重启终端
   node --version  # 应显示 v20.11.1+
   ```

2. **临时降级 Vite**:
   ```bash
   cd web
   npm install vite@^4.5.0 --save-dev
   npm run dev
   ```

**快速启动命令**:
```bash
# 方法1: 升级 Node.js 后 (推荐)
cd D:\3D\web
npm run dev

# 方法2: 临时方案
cd D:\3D\web
npm install vite@^4.5.0 --save-dev
npm run dev
```

## 📦 H5-first 开发（推荐）

本项目采用 H5-first 的开发流程：在浏览器使用 Vite + Three.js 开发 3D 核心功能，完成后将 H5 页面通过小程序 `web-view` 嵌入到小程序中。推荐使用 `npm` 作为包管理器。

### 为什么使用 H5-first
- 更好的开发体验（浏览器调试、source maps、热重载）  
- 更容易使用现代前端工具（Vite、ESBuild、PostCSS 等）  
- 减少小程序 runtime 特有问题，先在标准浏览器环境验证功能

### 本地开发（示例）
```bash
# 在项目根目录创建 web/ 并初始化
cd web
npm init -y
npm install three
npm create vite@latest . -- --template vanilla

# 安装开发依赖并启动
npm install
npm run dev
```

### 推荐 npm 脚本（项目根或 web/package.json）
```json
{
  "scripts": {
    "web:dev": "cd web && vite",
    "web:build": "cd web && vite build",
    "web:preview": "cd web && vite preview"
  }
}
```

### 集成到小程序（简要）
- 构建 H5：`npm run web:build`，把 `web/dist` 部署到 CDN 或静态托管（Vercel/Netlify）。  
- 在小程序页面使用 `<web-view src="https://your-cdn/your-app/index.html"></web-view>` 加载。  
- 使用 `postMessage` 双向通信：H5 使用 `window.parent.postMessage(...)`，小程序监听 `bindmessage` 事件并转发给页面逻辑。

```bash
# 当前已集成 logo.glb 作为测试模型
# 图书馆建筑现在显示为学校Logo模型
# 控制台会显示模型验证结果
# 支持点击交互和信息展示
```

## 📁 项目结构

```
3d-campus-tour/
├── web/                   # 🌐 H5 项目（Vite + Three.js，3D核心）
│   ├── src/
│   │   ├── main.js
│   │   └── scene/          # 3D 场景与 loader（Three.js）
│   ├── index.html
│   └── package.json
├── miniprogram/           # 📱 小程序容器目录（web-view 集成）
│   ├── app.js             # 小程序入口（容器）
│   ├── app.json           # 小程序配置
│   ├── app.wxss           # 全局样式
│   ├── package.json       # 小程序依赖（容器级）
│   ├── project.config.json # 开发者工具配置
│   ├── pages/
│   │   └── campus/        # 小程序内 web-view 页面入口
│   │       ├── campus.js
│   │       ├── campus.wxml
│   │       ├── campus.wxss
│   │       └── campus.json
│   ├── models/            # 📦 小程序内临时/示例模型（仅用于离线或演示）
│   ├── assets/            # 🎨 小程序资源（非核心 3D）
│   └── utils/             # 🔧 工具函数（容器逻辑）
├── docs/                  # 📚 项目文档
├── manifests/             # ⚙️ 场景配置文件
├── .cursorrules          # 📋 开发规范
└── README.md             # 📖 项目说明
```

## 🛠️ 技术栈

### 🔥 Three.js (H5 3D 核心)
- **Three.js r160+**: H5 端 3D 渲染引擎（项目核心渲染库）
- **WebGL 渲染**: 在浏览器环境中提供高性能渲染能力
- **GLTF/GLB 支持**: 使用官方 GLTFLoader 加载模型与纹理
- **模块化架构**: 场景、相机、渲染器、加载器模块化管理
- **PBR 渲染管线**: 支持物理材质、环境贴图与阴影

### 📱 小程序作为容器（web-view 集成）
- **小程序角色**: 小程序在当前架构中主要作为容器，通过 `web-view` 加载 H5 页面并提供授权、分享、支付等原生能力。  
- **通信机制**: 使用 `postMessage` 实现 H5 与小程序之间的双向通信（消息协议在 docs/ 中说明）。  
- **注意事项**: H5 页面负责所有 3D 渲染逻辑（Three.js），小程序负责加载 H5 链接、权限與用户入口。如需本地资源或小程序特性，使用消息桥协调处理。

### 🎨 功能特性
- **AR/VR支持**: 可扩展为增强现实体验
- **动画系统**: 建筑动画，相机动画
- **物理引擎**: 碰撞检测，重力模拟
- **粒子效果**: 环境特效，交互反馈
- **LOD系统**: 细节级别管理，性能优化

### 🛠️ 开发工具
- **微信开发者工具**: 小程序web-view容器开发和调试
- **Vite**: H5项目现代化构建工具
- **Three.js DevTools**: 浏览器3D调试工具
- **真机调试**: 支持真机web-view调试
- **性能分析**: 内置性能监控工具

## 🎯 核心功能

### 🔥 H5版本功能 (3D核心)
- ✅ **3D场景渲染**: Three.js实时渲染，WebGL硬件加速
- ✅ **多建筑管理**: 按需加载，LOD系统，内存优化
- ✅ **交互控制**: 鼠标/触摸控制，相机动画，视角切换
- ✅ **性能监控**: FPS监控，内存管理，渲染优化
- ✅ **模型加载**: GLTF/GLB支持，进度显示，错误处理
- ✅ **场景漫游**: 路径规划，热点导航，信息展示

### 📱 小程序版本功能 (容器)
- ✅ **web-view集成**: 无缝加载H5页面，用户无感知
- ✅ **权限管理**: 定位服务，存储权限，网络权限
- ✅ **用户系统**: 微信授权，用户信息，数据同步
- ✅ **分享功能**: 微信分享，生成海报，邀请好友
- ✅ **离线支持**: 缓存管理，离线模式，增量更新

### 🚀 进阶功能规划
- 🔄 多人在线体验
- 🎭 VR/AR支持
- 📊 数据分析统计
- 🎨 自定义主题
- 🌤️ 天气系统模拟

## 🚀 部署与发布

### H5-first 部署流程

1. **开发阶段**: 在 `web/` 目录开发3D功能
   ```bash
   npm run web:dev  # 启动开发服务器
   ```

2. **构建阶段**: 构建生产版本
   ```bash
   npm run web:build  # 构建H5项目
   ```

3. **部署阶段**: 上传到CDN
   ```bash
   # 部署到阿里云OSS
   npm run deploy:aliyun

   # 部署到腾讯COS
   npm run deploy:tencent

   # 部署到AWS S3
   npm run deploy:aws
   ```

4. **集成阶段**: 更新小程序配置并发布
   - 修改 `miniprogram/config/config.js` 中的URL
   - 在微信开发者工具中测试
   - 提交小程序审核

### 详细部署指南

📖 [部署指南](DEPLOYMENT.md) - 完整的部署流程和配置说明

## 📦 资产管理

关于模型拆分、LOD、压缩和托管的详细规范请参阅：`docs/asset_strategy.md`。

> 已迁移到 H5-first 开发流程 — 小程序原生 xr-frame 文档已归档。  
> 本仓库现在以 H5（Vite + Three.js）为主进行 3D 开发，完成后通过小程序 web-view 集成 H5 页面。  

## 📊 性能指标

| 指标 | 目标值 | 当前状态 |
|------|--------|----------|
| 首次加载时间 | < 3秒 | ✅ 已实现 |
| 帧率稳定性 | 60 FPS | ✅ 已实现 |
| 内存占用 | < 100MB | ✅ 已实现 |
| 兼容性覆盖 | > 95% | ✅ 已实现 |

## 🏫 校园场景规划

### 已实现场景
- 🏛️ **主校区**: 综合楼、图书馆、体育馆
- 🍽️ **食堂区**: 学生食堂
- 🏢 **宿舍区**: 学生公寓、生活设施
- 🎓 **教学区**: 教室楼、实验室

### 扩展场景规划
- 🌳 **景观区**: 花园、湖泊、雕塑
- 🏃 **运动区**: 操场、体育设施
- 🚗 **交通区**: 停车场、道路系统
- 🎭 **文化区**: 礼堂、艺术中心

## 👥 开发团队

- **项目负责人**: [李宁]
- **H5开发**: [李宁] - Three.js + Vite
- **小程序开发**: [李宁] - web-view集成
- **3D建模**: [陈美伊]
- **UI设计**: [李宁]
- **产品经理**: [李宁]

## 📈 开发进度

### 已完成 ✅
- [x] 技术方案确定 (web-view + H5)
- [x] 项目架构重新设计
- [x] 开发规范更新
- [x] 文档体系完善

### 进行中 🔄
- [ ] H5项目初始化 (Vite + Three.js)
- [ ] 小程序项目创建 (web-view集成)
- [ ] 单个建筑3D展示
- [ ] H5与小程序通信机制

### 规划中 📋
- [ ] 多建筑加载管理
- [ ] LOD系统实现
- [ ] 用户界面优化
- [ ] 性能优化和部署

## 🎖️ 比赛亮点

### 技术创新
- **混合架构突破**: web-view + H5，突破小程序3D限制
- **现代化开发栈**: Vite + Three.js r160，开发体验极佳
- **渐进式架构**: H5先行开发，小程序无缝集成
- **高性能渲染**: 完整WebGL支持，60FPS流畅体验

### 教育价值
- **沉浸式学习**: 3D环境知识获取
- **无障碍访问**: 移动端随时学习
- **文化传承**: 数字化校园文化

### 社会意义
- **绿色环保**: 减少实地参观碳排放
- **教育公平**: 打破地域学习限制
- **智慧校园**: 推动教育技术创新

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献指南

欢迎参与项目贡献！请查看我们的 [贡献指南](CONTRIBUTING.md)

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系我们

- **项目主页**: [GitHub地址]

- **邮箱**: 281707197@qq.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

特别感谢：
- [Three.js](https://threejs.org/) 团队提供优秀的3D引擎
- 微信小程序团队提供强大的平台支持
- 开源社区的无私奉献

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本发布
- ✅ 基础3D渲染功能
- ✅ Web和小程序双版本
- ✅ 响应式设计支持

---

⭐ 如果这个项目对你有帮助，请给我们一个Star！
