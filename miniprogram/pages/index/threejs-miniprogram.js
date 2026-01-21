// Shim to resolve 'threejs-miniprogram' in DevTools when package mapping fails.
// It forwards exports from miniprogram_npm/threejs-miniprogram/dist/index.js.
function safeRequire(path) {
  try { return require(path); } catch (e) { return null; }
}

const pkgPaths = [
  '../../miniprogram_npm/threejs-miniprogram/dist/index.js',
  '../../miniprogram_npm/threejs-miniprogram/index.js',
  'miniprogram_npm/threejs-miniprogram/dist/index.js',
  'threejs-miniprogram'
];

let pkg = null;
for (const p of pkgPaths) {
  pkg = safeRequire(p);
  if (pkg) break;
}

if (pkg) {
  // normalize possible locations of createScopedThreejs
  const createScoped = pkg.createScopedThreejs || (pkg.default && pkg.default.createScopedThreejs) || (pkg.exports && pkg.exports.createScopedThreejs);
  if (createScoped) {
    module.exports = { createScopedThreejs: createScoped };
  } else {
    // export whatever the pkg has
    module.exports = pkg;
  }
} else {
  module.exports = {};
  console.warn('threejs-miniprogram shim: underlying package not found via fallbacks.');
}


