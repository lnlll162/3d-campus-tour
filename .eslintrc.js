module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 代码风格规则
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],

    // 最佳实践
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // 允许console.log用于调试
    'no-debugger': 'warn',

    // 变量声明
    'prefer-const': 'error',
    'no-var': 'error',

    // 函数相关
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'arrow-spacing': 'error',

    // 对象和数组
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // 注释
    'multiline-comment-style': ['error', 'starred-block'],
    'spaced-comment': ['error', 'always'],

    // 其他
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all']
  },
  globals: {
    // Three.js 全局变量
    THREE: 'readonly',
    // 微信小程序全局变量
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly'
  }
};
