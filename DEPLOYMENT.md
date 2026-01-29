# 3D校园云旅游系统部署指南

本指南介绍如何将H5项目部署到CDN并更新小程序配置，实现完整的H5-first架构。

## 📋 前置条件

- 已完成H5功能开发
- 拥有CDN域名和存储空间（阿里云OSS、腾讯COS、AWS S3等）
- 小程序开发者工具和微信开发者平台账号

## 🚀 部署步骤

### 1. 构建H5项目

```bash
# 进入web目录
cd web

# 安装依赖（如果还没有安装）
npm install

# 构建生产版本
npm run build
```

构建完成后，会在 `web/dist/` 目录生成静态文件。

### 2. 上传到CDN

#### 阿里云OSS示例
```bash
# 安装OSS工具
npm install -g ali-oss

# 配置OSS（首次使用需要配置）
ali-oss config

# 上传dist目录到OSS
ali-oss cp dist/ oss://your-bucket/3d-campus/ --recursive
```

#### 腾讯COS示例
```bash
# 使用coscli工具
coscli cp -r dist/ cos://your-bucket-1234567890/3d-campus/
```

#### AWS S3示例
```bash
# 配置AWS CLI
aws configure

# 上传文件
aws s3 cp dist/ s3://your-bucket/3d-campus/ --recursive
```

### 3. 配置CDN域名

1. 在CDN控制台配置域名（如 `cdn.your-domain.com`）
2. 设置源站为OSS/COS/S3存储桶
3. 配置HTTPS证书
4. 设置缓存策略（HTML文件建议缓存时间短，JS/CSS文件可以缓存更久）

### 4. 更新小程序配置

#### 修改配置文件

编辑 `miniprogram/config/config.js`：

```javascript
const ENV_CONFIG = {
  // H5页面URL配置
  h5Urls: {
    develop: 'http://localhost:5173',
    trial: 'https://cdn-trial.your-domain.com/3d-campus',
    release: 'https://cdn.your-domain.com/3d-campus'
  },

  // CDN配置
  cdnUrls: {
    develop: '',
    trial: 'https://cdn-trial.your-domain.com',
    release: 'https://cdn.your-domain.com'
  }
}
```

#### 验证配置

1. 打开微信开发者工具
2. 导入 `miniprogram/` 目录
3. 点击预览或真机调试
4. 确认web-view能正确加载H5页面

## 🔧 环境配置详解

### 开发环境 (develop)
- **适用场景**: 本地开发调试
- **URL**: `http://localhost:5173`
- **特点**: 支持热重载，支持source maps

### 体验版环境 (trial)
- **适用场景**: 内测、分发给特定用户测试
- **URL**: `https://cdn-trial.your-domain.com/3d-campus`
- **特点**: 与正式环境隔离，可以安全测试新功能

### 正式版环境 (release)
- **适用场景**: 生产环境，面向所有用户
- **URL**: `https://cdn.your-domain.com/3d-campus`
- **特点**: 稳定的生产版本，启用所有监控和分析功能

## 📊 性能优化建议

### CDN配置
- **缓存策略**: HTML文件5分钟，JS/CSS文件1小时，资源文件24小时
- **Gzip压缩**: 启用文本文件压缩
- **HTTPS**: 强制HTTPS访问

### 监控和分析
- 启用错误监控（`enableAnalytics: true`）
- 配置性能监控上报
- 添加用户行为分析

## 🔄 版本更新流程

### 小版本更新（bug修复）
1. 修改H5代码
2. 构建并上传到CDN（保持相同路径）
3. 用户刷新小程序即可获得最新版本

### 大版本更新（新功能）
1. 修改H5代码
2. 构建并上传到CDN新路径
3. 更新小程序配置中的URL
4. 提交小程序审核

## 🐛 故障排除

### web-view无法加载
- 检查CDN域名是否正确配置
- 确认HTTPS证书有效
- 检查小程序基础库版本（需要2.5.0+）

### H5页面显示异常
- 检查构建产物是否完整
- 确认CDN缓存已刷新
- 检查浏览器控制台错误信息

### 小程序通信失败
- 确认H5页面能正常加载
- 检查postMessage消息格式
- 验证小程序事件监听是否正确设置

## 📞 技术支持

如遇到部署问题，请：
1. 检查控制台错误信息
2. 确认网络连接正常
3. 联系开发团队获取支持

---

*部署完成后，用户通过小程序即可体验完整的3D校园功能！* 🎉🏫
