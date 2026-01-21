// 测试threejs-miniprogram包的导出结构
const path = require('path');

// 模拟小程序环境的一些全局变量
global.wx = {
  createSelectorQuery: () => ({
    select: () => ({
      node: (callback) => {
        // 模拟canvas node
        const mockCanvas = {
          getContext: () => ({
            // mock WebGL context
          })
        };
        callback({ node: mockCanvas });
      }
    })
  })
};

global.getApp = () => ({
  globalData: {}
});

console.log('=== 测试threejs-miniprogram包导出结构 ===');

try {
  // 测试直接require
  console.log('1. 尝试直接require threejs-miniprogram...');
  const pkg1 = require('../miniprogram/miniprogram_npm/threejs-miniprogram/dist/index.js');
  console.log('✓ require成功');
  console.log('导出的类型:', typeof pkg1);
  console.log('导出的键:', Object.keys(pkg1).slice(0, 20));

  // 检查是否有createScopedThreejs
  if (pkg1.createScopedThreejs) {
    console.log('✓ 找到createScopedThreejs函数');
    console.log('createScopedThreejs类型:', typeof pkg1.createScopedThreejs);
  } else {
    console.log('✗ 未找到createScopedThreejs函数');
  }

  // 检查pkg1本身是否就是THREE对象
  if (pkg1.Scene && pkg1.WebGLRenderer) {
    console.log('✓ pkg1看起来是THREE对象 (有Scene和WebGLRenderer)');
  } else {
    console.log('✗ pkg1不是THREE对象 (缺少Scene或WebGLRenderer)');
  }

  // 测试createScopedThreejs函数调用
  console.log('\n3. 测试createScopedThreejs函数调用...');
  try {
    // 创建mock canvas
    const mockCanvas = {
      getContext: (type) => {
        if (type === 'webgl') {
          return {}; // mock WebGL context
        }
        return null;
      },
      width: 375,
      height: 667
    };

    const THREE = pkg1.createScopedThreejs(mockCanvas);
    console.log('✓ createScopedThreejs调用成功');
    console.log('THREE类型:', typeof THREE);
    console.log('THREE键 (前20个):', Object.keys(THREE).slice(0, 20));

    // 检查THREE对象是否有核心类
    const hasScene = !!THREE.Scene;
    const hasRenderer = !!THREE.WebGLRenderer;
    const hasCamera = !!THREE.PerspectiveCamera;

    console.log('✓ THREE.Scene存在:', hasScene);
    console.log('✓ THREE.WebGLRenderer存在:', hasRenderer);
    console.log('✓ THREE.PerspectiveCamera存在:', hasCamera);

    if (hasScene && hasRenderer && hasCamera) {
      console.log('✓ THREE对象看起来完整');
    } else {
      console.log('✗ THREE对象不完整');
    }

  } catch (e) {
    console.log('✗ createScopedThreejs调用失败:', e.message);
    console.log('错误堆栈:', e.stack);
  }

} catch (e) {
  console.log('✗ require失败:', e.message);
  console.log('错误堆栈:', e.stack);
}

try {
  // 测试通过shim文件
  console.log('\n2. 尝试通过shim文件...');
  const shim = require('../miniprogram/pages/index/threejs-miniprogram.js');
  console.log('✓ shim require成功');
  console.log('shim导出的键:', Object.keys(shim));

  if (shim.createScopedThreejs) {
    console.log('✓ shim中有createScopedThreejs');
    console.log('createScopedThreejs类型:', typeof shim.createScopedThreejs);
  } else {
    console.log('✗ shim中无createScopedThreejs');
  }

} catch (e) {
  console.log('✗ shim require失败:', e.message);
}

// 测试小程序风格的全局对象设置
console.log('\n4. 测试小程序风格的全局对象设置...');

// 模拟小程序环境
const mockWx = {};
const mockApp = {};

global.wx = mockWx;
global.getApp = () => mockApp;

try {
  const pkg = require('../miniprogram/miniprogram_npm/threejs-miniprogram/dist/index.js');
  const createScopedThreejs = pkg.createScopedThreejs;

  // 创建mock canvas (模拟小程序canvas node)
  const mockCanvas = {
    getContext: (type) => {
      if (type === 'webgl') {
        return {}; // mock WebGL context
      }
      return null;
    },
    width: 375,
    height: 667
  };

  const THREE = createScopedThreejs(mockCanvas);

  // 测试多种全局对象设置方式（模拟修复后的代码）
  console.log('测试global.THREE设置...');
  try {
    global.THREE = THREE;
    console.log('✓ global.THREE设置成功');
  } catch (e) {
    console.log('✗ global.THREE设置失败:', e.message);
  }

  console.log('测试wx.THREE设置...');
  try {
    mockWx.THREE = THREE;
    console.log('✓ wx.THREE设置成功');
  } catch (e) {
    console.log('✗ wx.THREE设置失败:', e.message);
  }

  console.log('测试getApp().THREE设置...');
  try {
    mockApp.THREE = THREE;
    console.log('✓ getApp().THREE设置成功');
  } catch (e) {
    console.log('✗ getApp().THREE设置失败:', e.message);
  }

  // 测试获取逻辑（模拟修复后的init3DScene）
  console.log('\n测试THREE获取逻辑...');
  let retrievedTHREE = null;

  try { retrievedTHREE = global.THREE; } catch (e) { /* ignore */ }
  if (!retrievedTHREE) try { retrievedTHREE = mockWx.THREE; } catch (e) { /* ignore */ }
  if (!retrievedTHREE) try { retrievedTHREE = mockApp.THREE; } catch (e) { /* ignore */ }

  if (retrievedTHREE) {
    console.log('✓ 成功获取THREE对象');
    console.log('✓ THREE.Scene存在:', !!retrievedTHREE.Scene);
    console.log('✓ THREE.WebGLRenderer存在:', !!retrievedTHREE.WebGLRenderer);
  } else {
    console.log('✗ 获取THREE失败');
  }

} catch (e) {
  console.log('✗ 测试全局对象设置失败:', e.message);
}

console.log('\n=== 测试完成 ===');
