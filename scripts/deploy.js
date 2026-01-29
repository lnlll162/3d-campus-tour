#!/usr/bin/env node

/**
 * 3D校园云旅游系统部署脚本
 * 用于自动构建和部署H5项目到CDN
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 配置
const CONFIG = {
  distDir: path.join(__dirname, '..', 'web', 'dist'),
  deployTargets: {
    aliyun: {
      command: 'ali-oss cp dist/ oss://your-bucket/3d-campus/ --recursive',
      description: '阿里云OSS'
    },
    tencent: {
      command: 'coscli cp -r dist/ cos://your-bucket/3d-campus/',
      description: '腾讯COS'
    },
    aws: {
      command: 'aws s3 cp dist/ s3://your-bucket/3d-campus/ --recursive',
      description: 'AWS S3'
    }
  }
}

/**
 * 检查环境
 */
function checkEnvironment() {
  console.log('🔍 检查部署环境...')

  // 检查web目录是否存在
  const webDir = path.join(__dirname, '..', 'web')
  if (!fs.existsSync(webDir)) {
    console.error('❌ web目录不存在，请确保在项目根目录运行')
    process.exit(1)
  }

  // 检查package.json
  const packageJson = path.join(webDir, 'package.json')
  if (!fs.existsSync(packageJson)) {
    console.error('❌ web/package.json不存在')
    process.exit(1)
  }

  console.log('✅ 环境检查通过')
}

/**
 * 构建项目
 */
function buildProject() {
  console.log('🏗️ 构建H5项目...')

  try {
    const webDir = path.join(__dirname, '..', 'web')
    process.chdir(webDir)

    // 安装依赖
    console.log('📦 安装依赖...')
    execSync('npm install', { stdio: 'inherit' })

    // 构建项目
    console.log('🔨 构建项目...')
    execSync('npm run build', { stdio: 'inherit' })

    // 检查构建结果
    if (!fs.existsSync(CONFIG.distDir)) {
      console.error('❌ 构建失败，dist目录不存在')
      process.exit(1)
    }

    console.log('✅ 构建完成')
  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    process.exit(1)
  }
}

/**
 * 部署到CDN
 */
function deployToCDN(target) {
  const deployConfig = CONFIG.deployTargets[target]

  if (!deployConfig) {
    console.error(`❌ 不支持的部署目标: ${target}`)
    console.log('支持的目标:', Object.keys(CONFIG.deployTargets).join(', '))
    process.exit(1)
  }

  console.log(`📤 部署到${deployConfig.description}...`)

  try {
    const webDir = path.join(__dirname, '..', 'web')
    process.chdir(webDir)

    execSync(deployConfig.command, { stdio: 'inherit' })

    console.log('✅ 部署完成')
  } catch (error) {
    console.error('❌ 部署失败:', error.message)
    console.log('请确保已正确配置CDN工具')
    process.exit(1)
  }
}

/**
 * 更新小程序配置
 */
function updateMiniProgramConfig(env, cdnUrl) {
  console.log('🔧 更新小程序配置...')

  const configPath = path.join(__dirname, '..', 'miniprogram', 'config', 'config.js')

  if (!fs.existsSync(configPath)) {
    console.warn('⚠️ 小程序配置文件不存在，跳过更新')
    return
  }

  try {
    let configContent = fs.readFileSync(configPath, 'utf8')

    // 更新对应环境的URL
    const urlPattern = new RegExp(`(${env}:\\s*')[^']*(')`, 'g')
    configContent = configContent.replace(urlPattern, `$1${cdnUrl}$2`)

    fs.writeFileSync(configPath, configContent)

    console.log(`✅ 小程序配置已更新 (${env}: ${cdnUrl})`)
  } catch (error) {
    console.error('❌ 更新小程序配置失败:', error.message)
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
3D校园云旅游系统部署脚本

用法:
  node scripts/deploy.js [target] [options]

目标 (target):
  aliyun    部署到阿里云OSS
  tencent   部署到腾讯COS
  aws       部署到AWS S3

选项:
  --env     指定环境 (develop/trial/release) 默认: release
  --url     指定CDN URL
  --help    显示帮助信息

示例:
  # 部署到阿里云OSS
  node scripts/deploy.js aliyun

  # 部署到腾讯COS (体验版)
  node scripts/deploy.js tencent --env trial

  # 手动指定CDN URL
  node scripts/deploy.js aliyun --url https://cdn.your-domain.com/3d-campus

注意: 请先配置相应的CDN工具 (ali-oss, coscli, awscli)
`)
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    showHelp()
    return
  }

  const target = args[0]
  let env = 'release'
  let customUrl = null

  // 解析参数
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
        env = args[++i]
        break
      case '--url':
        customUrl = args[++i]
        break
    }
  }

  console.log('🚀 开始部署3D校园系统')
  console.log(`目标: ${target}`)
  console.log(`环境: ${env}`)
  if (customUrl) {
    console.log(`CDN URL: ${customUrl}`)
  }
  console.log('---')

  // 执行部署步骤
  checkEnvironment()
  buildProject()

  if (customUrl) {
    // 使用自定义URL
    updateMiniProgramConfig(env, customUrl)
  } else {
    // 部署到CDN
    deployToCDN(target)

    // 推断CDN URL (这里需要根据实际情况调整)
    const cdnUrls = {
      aliyun: 'https://your-bucket.oss-cn-hangzhou.aliyuncs.com/3d-campus',
      tencent: 'https://your-bucket-1234567890.cos.ap-beijing.myqcloud.com/3d-campus',
      aws: 'https://your-bucket.s3.amazonaws.com/3d-campus'
    }

    const cdnUrl = cdnUrls[target]
    if (cdnUrl) {
      updateMiniProgramConfig(env, cdnUrl)
    }
  }

  console.log('🎉 部署完成！')
  console.log('')
  console.log('接下来请:')
  console.log('1. 在微信开发者工具中测试小程序')
  console.log('2. 提交小程序审核（如果是正式版）')
  console.log('3. 监控用户反馈和性能指标')
}

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = { main, CONFIG }
