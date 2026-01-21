# 天津商业大学UI设计规范

## 🎨 品牌色彩系统

### 官方品牌色

基于天津商业大学官方网站和品牌手册，以下为标准色彩定义：

```css
/* ===== 天津商业大学品牌色系统 ===== */

/* 主色系 - 深蓝色调 */
--tuc-primary: #003366;      /* 天商深蓝 - 主要品牌色 */
--tuc-secondary: #004080;    /* 天商商务蓝 - 辅助品牌色 */
--tuc-accent: #1a4f7a;       /* 天商亮蓝 - 强调色 */

/* 装饰色系 - 金色调 */
--tuc-gold: #d4af37;         /* 天商金色 - 主要装饰色 */
--tuc-light-gold: #ffd700;   /* 亮金色 - 高亮装饰色 */

/* 中性色系 */
--tuc-white: #ffffff;        /* 纯白 */
--tuc-gray-50: #f8fafc;      /* 极浅灰 */
--tuc-gray-100: #f1f5f9;     /* 浅灰 */
--tuc-gray-200: #e2e8f0;     /* 中浅灰 */
--tuc-gray-300: #cbd5e1;     /* 中灰 */
--tuc-gray-400: #94a3b8;     /* 灰色 */
--tuc-gray-500: #64748b;     /* 中深灰 */
--tuc-gray-600: #475569;     /* 深灰 */
--tuc-gray-700: #334155;     /* 极深灰 */
--tuc-gray-800: #1e293b;     /* 深黑灰 */
--tuc-gray-900: #0f172a;     /* 近黑 */
```

### 色彩应用规范

#### 1. 主色应用
- **导航栏背景**: `var(--tuc-primary)`
- **主要按钮**: `var(--tuc-primary)` 到 `var(--tuc-secondary)` 渐变
- **重要文字**: `var(--tuc-primary)`
- **图标主要色**: `var(--tuc-primary)`

#### 2. 装饰色应用
- **边框装饰**: `var(--tuc-gold)`
- **分割线**: `var(--tuc-gold)`
- **强调元素**: `var(--tuc-gold)`
- **加载指示器**: `var(--tuc-gold)`

#### 3. 中性色应用
- **背景色**: `var(--tuc-gray-50)` 到 `var(--tuc-gray-100)`
- **卡片背景**: `var(--tuc-white)`
- **文字颜色**: `var(--tuc-gray-600)` 到 `var(--tuc-gray-800)`
- **边框**: `var(--tuc-gray-200)` 到 `var(--tuc-gray-300)`

## 📐 设计元素规范

### 按钮设计系统

#### 主要按钮 (Primary Button)
```css
.primary-btn {
  background: linear-gradient(135deg, var(--tuc-primary) 0%, var(--tuc-secondary) 100%);
  color: var(--tuc-white);
  border: 2rpx solid var(--tuc-gold);
  border-radius: 12rpx;
  padding: 24rpx 48rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(0, 51, 102, 0.3);
}
```

#### 次要按钮 (Secondary Button)
```css
.secondary-btn {
  background: var(--tuc-white);
  color: var(--tuc-primary);
  border: 2rpx solid var(--tuc-gold);
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  font-weight: 500;
}
```

#### 强调按钮 (Accent Button)
```css
.accent-btn {
  background: linear-gradient(135deg, var(--tuc-gold) 0%, var(--tuc-light-gold) 100%);
  color: var(--tuc-primary);
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  font-weight: 600);
}
```

### 卡片设计系统

#### 信息卡片 (Info Card)
```css
.info-card {
  background: linear-gradient(135deg, var(--tuc-white) 0%, var(--tuc-gray-50) 100%);
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 51, 102, 0.15);
  border: 2rpx solid var(--tuc-gray-100);
  position: relative;
  overflow: hidden;
}

/* 顶部装饰条 */
.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, var(--tuc-primary) 0%, var(--tuc-gold) 50%, var(--tuc-secondary) 100%);
}
```

#### 功能卡片 (Function Card)
```css
.function-card {
  background: var(--tuc-white);
  border-radius: 12rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 51, 102, 0.1);
  border: 1rpx solid var(--tuc-gray-200);
  transition: all 0.3s ease;
}

.function-card:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 51, 102, 0.15);
}
```

### 导航栏设计

#### 主导航栏
```css
.main-nav {
  background: linear-gradient(135deg, var(--tuc-primary) 0%, var(--tuc-secondary) 100%);
  height: 88rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 标题样式 */
.nav-title {
  color: var(--tuc-white);
  font-size: 36rpx;
  font-weight: bold;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

/* 装饰性标题 */
.nav-title::after {
  content: '';
  display: block;
  width: 60rpx;
  height: 4rpx;
  background: var(--tuc-gold);
  border-radius: 2rpx;
  margin: 8rpx auto 0;
}
```

## 🎯 交互设计规范

### 动效系统

#### 按钮动效
```css
.btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 51, 102, 0.4);
}

/* 波纹效果 */
.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:active::before {
  width: 300rpx;
  height: 300rpx;
}
```

#### 卡片动效
```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-8rpx);
  box-shadow: 0 12rpx 40rpx rgba(0, 51, 102, 0.2);
}
```

### 加载状态

#### 加载指示器
```css
.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid var(--tuc-gray-200);
  border-top: 6rpx solid var(--tuc-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### 进度条
```css
.progress-bar {
  width: 100%;
  height: 8rpx;
  background: var(--tuc-gray-200);
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--tuc-gold) 0%, var(--tuc-light-gold) 100%);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}
```

## 📱 响应式设计规范

### 断点系统
```css
/* 小程序响应式断点 (rpx单位) */
/* 手机端 */
@media (max-width: 750rpx) {
  .container { padding: 20rpx; }
  .btn { padding: 16rpx 32rpx; font-size: 28rpx; }
  .card { margin: 16rpx; }
}

/* 平板端 */
@media (min-width: 751rpx) and (max-width: 1024rpx) {
  .container { padding: 32rpx; }
  .btn { padding: 20rpx 40rpx; font-size: 32rpx; }
  .card { margin: 24rpx; }
}

/* 桌面端 */
@media (min-width: 1025rpx) {
  .container { padding: 48rpx; }
  .btn { padding: 24rpx 48rpx; font-size: 36rpx; }
  .card { margin: 32rpx; }
}
```

### 布局系统

#### 网格布局
```css
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.grid-item {
  flex: 1;
  min-width: 300rpx;
  max-width: 400rpx;
}
```

#### 弹性布局
```css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32rpx;
}
```

## 🔤 字体规范

### 字体层级
```css
/* 标题字体 */
.h1 { font-size: 48rpx; font-weight: bold; line-height: 1.2; }
.h2 { font-size: 42rpx; font-weight: bold; line-height: 1.3; }
.h3 { font-size: 36rpx; font-weight: bold; line-height: 1.4; }
.h4 { font-size: 32rpx; font-weight: 600; line-height: 1.4; }

/* 正文字体 */
.body-large { font-size: 32rpx; line-height: 1.6; }
.body { font-size: 30rpx; line-height: 1.6; }
.body-small { font-size: 28rpx; line-height: 1.6; }

/* 辅助文字 */
.caption { font-size: 26rpx; color: var(--tuc-gray-500); line-height: 1.5; }
.label { font-size: 24rpx; font-weight: 500; line-height: 1.4; }
```

### 字体颜色
```css
.text-primary { color: var(--tuc-primary); }
.text-secondary { color: var(--tuc-secondary); }
.text-accent { color: var(--tuc-accent); }
.text-gold { color: var(--tuc-gold); }
.text-white { color: var(--tuc-white); }
.text-gray-600 { color: var(--tuc-gray-600); }
.text-gray-700 { color: var(--tuc-gray-700); }
.text-gray-800 { color: var(--tuc-gray-800); }
```

## 🎭 图标设计规范

### 图标风格
- **风格**: 简洁现代，线条流畅
- **粗细**: 2rpx 线条宽度
- **圆角**: 2rpx 圆角半径
- **颜色**: 主要使用 `var(--tuc-primary)` 和 `var(--tuc-gold)`

### 常用图标尺寸
```css
.icon-small { width: 32rpx; height: 32rpx; }
.icon-medium { width: 48rpx; height: 48rpx; }
.icon-large { width: 64rpx; height: 64rpx; }
.icon-xl { width: 80rpx; height: 80rpx; }
```

## 📋 组件使用指南

### 色彩搭配建议

#### 成功状态
```css
.success { color: #10b981; }
.success-bg { background: rgba(16, 185, 129, 0.1); }
.success-border { border-color: #10b981; }
```

#### 警告状态
```css
.warning { color: #f59e0b; }
.warning-bg { background: rgba(245, 158, 11, 0.1); }
.warning-border { border-color: #f59e0b; }
```

#### 错误状态
```css
.error { color: #ef4444; }
.error-bg { background: rgba(239, 68, 68, 0.1); }
.error-border { border-color: #ef4444; }
```

### 无障碍设计

#### 对比度要求
- 正常文字：4.5:1 对比度
- 大文字：3:1 对比度
- 图标：3:1 对比度

#### 触摸目标
- 最小触摸区域：88rpx × 88rpx
- 推荐触摸区域：112rpx × 112rpx

---

*遵循本规范，确保天津商业大学3D校园云旅游系统具有一致的视觉风格和优秀的用户体验。*
