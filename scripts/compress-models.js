#!/usr/bin/env node

/**
 * 3D模型压缩脚本
 * 使用 gltf-pipeline 或 gltfpack 对 GLTF/GLB 模型进行压缩优化
 *
 * 用法:
 * node scripts/compress-models.js <input.glb> <output.glb> [options]
 *
 * 依赖:
 * npm install gltf-pipeline
 * 或使用 gltfpack (https://github.com/zeux/meshoptimizer)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ModelCompressor {
  constructor() {
    this.supportedFormats = ['.glb', '.gltf'];
  }

  // 检查文件是否存在
  checkFile(inputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`);
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(`不支持的文件格式: ${ext}。支持的格式: ${this.supportedFormats.join(', ')}`);
    }
  }

  // 使用 gltf-pipeline 压缩
  compressWithGltfPipeline(inputPath, outputPath, options = {}) {
    console.log('使用 gltf-pipeline 进行压缩...');

    const {
      dracoCompression = true,
      dracoQuantizePosition = 14,
      dracoQuantizeNormal = 10,
      dracoQuantizeTexcoord = 12,
      dracoQuantizeColor = 8,
      dracoQuantizeGeneric = 12,
      ktx2Compression = true
    } = options;

    let command = `npx gltf-pipeline -i "${inputPath}" -o "${outputPath}"`;

    if (dracoCompression) {
      command += ` -d`;
      command += ` --draco.quantizePosition=${dracoQuantizePosition}`;
      command += ` --draco.quantizeNormal=${dracoQuantizeNormal}`;
      command += ` --draco.quantizeTexcoord=${dracoQuantizeTexcoord}`;
      command += ` --draco.quantizeColor=${dracoQuantizeColor}`;
      command += ` --draco.quantizeGeneric=${dracoQuantizeGeneric}`;
    }

    try {
      console.log('执行命令:', command);
      execSync(command, { stdio: 'inherit' });
      console.log('✅ gltf-pipeline 压缩完成');
    } catch (error) {
      console.error('❌ gltf-pipeline 压缩失败:', error.message);
      throw error;
    }
  }

  // 使用 gltfpack 压缩
  compressWithGltfpack(inputPath, outputPath, options = {}) {
    console.log('使用 gltfpack 进行压缩...');

    const {
      compression = 'meshopt', // meshopt 或 kraco
      level = 5, // 压缩级别 0-5
      quantizePosition = 14,
      quantizeNormal = 8,
      quantizeTexcoord = 10
    } = options;

    let command = `gltfpack -i "${inputPath}" -o "${outputPath}"`;
    command += ` -cc`; // 启用颜色量化
    command += ` -tc`; // 启用纹理压缩

    if (compression === 'meshopt') {
      command += ` -c`; // meshopt 压缩
    }

    command += ` -mi ${level}`; // meshopt 迭代次数

    try {
      console.log('执行命令:', command);
      execSync(command, { stdio: 'inherit' });
      console.log('✅ gltfpack 压缩完成');
    } catch (error) {
      console.error('❌ gltfpack 压缩失败:', error.message);
      console.log('请确保已安装 gltfpack: https://github.com/zeux/meshoptimizer');
      throw error;
    }
  }

  // 获取文件大小
  getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    const sizeInBytes = stats.size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return {
      bytes: sizeInBytes,
      mb: sizeInMB
    };
  }

  // 显示压缩结果
  showCompressionResult(inputPath, outputPath) {
    const inputSize = this.getFileSize(inputPath);
    const outputSize = this.getFileSize(outputPath);

    const ratio = ((inputSize.bytes - outputSize.bytes) / inputSize.bytes * 100).toFixed(2);

    console.log('\n📊 压缩结果:');
    console.log(`原始大小: ${inputSize.mb} MB`);
    console.log(`压缩后大小: ${outputSize.mb} MB`);
    console.log(`压缩率: ${ratio}%`);
  }

  // 主压缩方法
  async compress(inputPath, outputPath, options = {}) {
    console.log(`开始压缩模型: ${inputPath} -> ${outputPath}`);

    // 检查输入文件
    this.checkFile(inputPath);

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const inputSize = this.getFileSize(inputPath);
    console.log(`输入文件大小: ${inputSize.mb} MB`);

    const {
      compressor = 'auto', // auto, gltf-pipeline, gltfpack
      ...compressOptions
    } = options;

    try {
      if (compressor === 'gltf-pipeline' || compressor === 'auto') {
        try {
          this.compressWithGltfPipeline(inputPath, outputPath, compressOptions);
        } catch (error) {
          if (compressor === 'auto') {
            console.log('gltf-pipeline 不可用，尝试 gltfpack...');
            this.compressWithGltfpack(inputPath, outputPath, compressOptions);
          } else {
            throw error;
          }
        }
      } else if (compressor === 'gltfpack') {
        this.compressWithGltfpack(inputPath, outputPath, compressOptions);
      }

      this.showCompressionResult(inputPath, outputPath);
      console.log('🎉 模型压缩完成!');

    } catch (error) {
      console.error('❌ 压缩失败:', error.message);
      process.exit(1);
    }
  }
}

// CLI 接口
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('用法: node scripts/compress-models.js <input.glb> <output.glb> [options]');
    console.log('\n选项:');
    console.log('  --compressor <type>     压缩器类型: auto, gltf-pipeline, gltfpack (默认: auto)');
    console.log('  --no-draco             禁用 Draco 压缩');
    console.log('  --no-ktx2              禁用 KTX2 压缩');
    console.log('\n示例:');
    console.log('  node scripts/compress-models.js models/input.glb models/output.glb');
    console.log('  node scripts/compress-models.js models/input.glb models/output.glb --compressor gltfpack');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;
  const options = {};

  // 解析命令行选项
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--compressor' && args[i + 1]) {
      options.compressor = args[i + 1];
      i++;
    } else if (arg === '--no-draco') {
      options.dracoCompression = false;
    } else if (arg === '--no-ktx2') {
      options.ktx2Compression = false;
    }
  }

  const compressor = new ModelCompressor();
  compressor.compress(inputPath, outputPath, options);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = ModelCompressor;
