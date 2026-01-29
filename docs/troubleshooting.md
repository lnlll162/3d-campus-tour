# 🔧 故障排除指南

## Node.js 版本兼容性问题

### 问题描述
启动开发服务器时出现以下错误：
```
error when starting dev server:
TypeError: crypto$2.getRandomValues is not a function
```

### 问题原因
- Node.js 版本过低 (当前 v16.20.2)
- Vite 5.0+ 需要 Node.js 18.17.0+
- `crypto.getRandomValues` 是 Node.js 18+ 的新特性

### 解决方案

#### 方法一：升级 Node.js (推荐)

1. **下载最新版本**
   - 访问: https://nodejs.org/
   - 下载: Node.js 20.11.1+ (LTS 版本)
   - 选择: Windows Installer (.msi) 64-bit

2. **安装步骤**
   - 运行下载的安装程序
   - 按照默认设置安装
   - 安装完成后重启终端/PowerShell

3. **验证安装**
   ```bash
   node --version  # 应显示 v20.11.1+
   npm --version   # 应显示 10.2.4+
   ```

4. **启动项目**
   ```bash
   cd D:\3D\web
   npm run dev
   ```

#### 方法二：使用 nvm-windows 管理版本

1. **安装 nvm-windows**
   ```bash
   # 下载安装程序
   # https://github.com/coreybutler/nvm-windows/releases
   ```

2. **安装 Node.js 20**
   ```bash
   nvm install 20.11.1
   nvm use 20.11.1
   ```

3. **验证并启动**
   ```bash
   node --version
   cd D:\3D\web
   npm run dev
   ```

#### 方法三：临时降级 Vite (不推荐长期使用)

1. **降级 Vite 版本**
   ```bash
   cd D:\3D\web
   npm install vite@^4.5.0 --save-dev
   ```

2. **启动项目**
   ```bash
   npm run dev
   ```

### 推荐工作流

#### 日常开发 (推荐升级 Node.js 后)
```bash
# 快速启动
cd D:\3D\web
npm run dev
```

#### 临时调试 (降级方案)
```bash
# 如果遇到版本问题
cd D:\3D\web
npm install vite@^4.5.0 --save-dev
npm run dev
```

### 环境要求

- **Node.js**: >= 18.17.0 (推荐 20.11.1+)
- **npm**: >= 9.0.0 (推荐 10.2.4+)
- **PowerShell**: Windows PowerShell 7+

### 相关链接

- [Node.js 下载](https://nodejs.org/)
- [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [Vite 兼容性](https://vitejs.dev/guide/#browser-support)