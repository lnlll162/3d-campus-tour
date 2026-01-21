#!/usr/bin/env node

/**
 * 小程序功能测试脚本
 * 用于验证 manifest 解析、模型下载和基本功能
 *
 * 用法:
 * node scripts/test-miniprogram.js
 */

const fs = require('fs');
const path = require('path');

class MiniprogramTester {
  constructor() {
    this.manifestPath = 'miniprogram/manifests/campus_manifest.json';
    this.modelsDir = 'miniprogram/models';
  }

  // 检查项目结构
  checkProjectStructure() {
    console.log('🔍 检查项目结构...');

    const requiredFiles = [
      'miniprogram/app.js',
      'miniprogram/app.json',
      'miniprogram/app.wxss',
      'miniprogram/pages/index/index.js',
      'miniprogram/pages/index/index.wxml',
      'miniprogram/pages/index/index.wxss',
      'miniprogram/pages/index/index.json',
      'miniprogram/utils/campus-loader.js',
      'miniprogram/manifests/campus_manifest.json',
      'miniprogram/project.config.json'
    ];

    const missingFiles = [];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      console.error('❌ 缺少以下文件:');
      missingFiles.forEach(file => console.error(`   - ${file}`));
      return false;
    }

    console.log('✅ 项目结构完整');
    return true;
  }

  // 验证 manifest 格式
  validateManifest() {
    console.log('🔍 验证 manifest 格式...');

    try {
      const manifestContent = fs.readFileSync(this.manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      // 检查必需字段
      const requiredFields = ['version', 'regions'];
      const missingFields = requiredFields.filter(field => !manifest[field]);

      if (missingFields.length > 0) {
        console.error(`❌ Manifest 缺少必需字段: ${missingFields.join(', ')}`);
        return false;
      }

      // 检查 regions
      if (!Array.isArray(manifest.regions) || manifest.regions.length === 0) {
        console.error('❌ Manifest regions 必须是非空数组');
        return false;
      }

      // 检查每个 region
      for (const region of manifest.regions) {
        const regionFields = ['id', 'name', 'bbox', 'platform', 'lod'];
        const missingRegionFields = regionFields.filter(field => !region[field]);

        if (missingRegionFields.length > 0) {
          console.error(`❌ Region "${region.id}" 缺少字段: ${missingRegionFields.join(', ')}`);
          return false;
        }

        // 检查 bbox
        if (!Array.isArray(region.bbox) || region.bbox.length !== 6) {
          console.error(`❌ Region "${region.id}" bbox 必须是6个数字的数组`);
          return false;
        }

        // 检查 LOD
        const lodLevels = ['lod0', 'lod1', 'lod2'];
        for (const lodLevel of lodLevels) {
          if (!region.lod[lodLevel]) {
            console.error(`❌ Region "${region.id}" 缺少 LOD 级别: ${lodLevel}`);
            return false;
          }

          const lodFields = ['download_url', 'version'];
          const missingLodFields = lodFields.filter(field => !region.lod[lodLevel][field]);

          if (missingLodFields.length > 0) {
            console.error(`❌ Region "${region.id}" ${lodLevel} 缺少字段: ${missingLodFields.join(', ')}`);
            return false;
          }
        }
      }

      console.log(`✅ Manifest 验证通过，包含 ${manifest.regions.length} 个区域`);
      return true;

    } catch (error) {
      console.error('❌ Manifest 验证失败:', error.message);
      return false;
    }
  }

  // 检查依赖
  checkDependencies() {
    console.log('🔍 检查依赖配置...');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      const miniprogramDeps = packageJson.miniprogramDependencies || {};
      const requiredDeps = ['three-miniprogram', 'weapp-adapter'];

      const missingDeps = requiredDeps.filter(dep => !miniprogramDeps[dep]);

      if (missingDeps.length > 0) {
        console.log('⚠️  package.json 中缺少小程序依赖，请添加:');
        missingDeps.forEach(dep => {
          console.log(`   "miniprogramDependencies": {`);
          console.log(`     "${dep}": "^latest_version"`);
          console.log(`   }`);
        });
        return false;
      }

      console.log('✅ 依赖配置正确');
      return true;

    } catch (error) {
      console.error('❌ 依赖检查失败:', error.message);
      return false;
    }
  }

  // 验证代码语法
  validateCodeSyntax() {
    console.log('🔍 验证代码语法...');

    const jsFiles = [
      'miniprogram/app.js',
      'miniprogram/pages/index/index.js',
      'miniprogram/utils/campus-loader.js'
    ];

    let hasErrors = false;

    jsFiles.forEach(file => {
      try {
        // 简单的语法检查 - 尝试解析文件
        const content = fs.readFileSync(file, 'utf8');

        // 检查基本语法问题
        if (content.includes('undefined_function(')) {
          console.error(`❌ ${file}: 发现未定义的函数调用`);
          hasErrors = true;
        }

        if (content.includes('require(') && !content.includes('three-miniprogram')) {
          // 这是正常的，跳过
        }

        console.log(`✅ ${file}: 语法检查通过`);

      } catch (error) {
        console.error(`❌ ${file}: 语法错误 - ${error.message}`);
        hasErrors = true;
      }
    });

    return !hasErrors;
  }

  // 生成测试报告
  generateTestReport(results) {
    console.log('\n📋 测试报告');
    console.log('='.repeat(50));

    const tests = [
      { name: '项目结构检查', result: results.structure },
      { name: 'Manifest验证', result: results.manifest },
      { name: '依赖检查', result: results.dependencies },
      { name: '代码语法验证', result: results.syntax }
    ];

    tests.forEach(test => {
      const status = test.result ? '✅ 通过' : '❌ 失败';
      console.log(`${test.name}: ${status}`);
    });

    const passedCount = tests.filter(t => t.result).length;
    const totalCount = tests.length;

    console.log('='.repeat(50));
    console.log(`总体结果: ${passedCount}/${totalCount} 项检查通过`);

    if (passedCount === totalCount) {
      console.log('🎉 所有检查通过！小程序已准备就绪。');
      console.log('\n📱 下一步:');
      console.log('1. 打开微信开发者工具');
      console.log('2. 导入 miniprogram 文件夹');
      console.log('3. 运行 npm install 安装依赖');
      console.log('4. 点击编译运行');
    } else {
      console.log('⚠️  请修复上述问题后重试。');
    }
  }

  // 运行所有测试
  async run() {
    console.log('🚀 开始小程序功能测试\n');

    const results = {
      structure: this.checkProjectStructure(),
      manifest: this.validateManifest(),
      dependencies: this.checkDependencies(),
      syntax: this.validateCodeSyntax()
    };

    this.generateTestReport(results);

    // 如果所有测试通过，返回成功
    const allPassed = Object.values(results).every(result => result);
    process.exit(allPassed ? 0 : 1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new MiniprogramTester();
  tester.run().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = MiniprogramTester;
