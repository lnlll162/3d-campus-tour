# 部署与提审（微信小程序）清单

本文档把上线前必须做的配置、白名单项、模型上传与 manifest 生成步骤、以及提审检查点整理为可执行清单，便于快速通过微信小程序审核并保证线上稳定运行。

注意：本清单假定项目已使用正式 AppID（`wx3352b8a1a284fe46`）并把模型托管在外部 CDN/OSS（推荐 S3/OSS/COS + CDN）。

--- 

## 1. 必备前提
- 已在微信公众平台注册并完成小程序主体认证（或至少已获得 AppID）。  
- 已获得生产 CDN/OSS 的上传权限与域名（例如 `cdn.tuc.edu.cn` 或 `your-bucket.s3.cn-region.amazonaws.com`）。  
- 本地代码已将 AppID 写入：`miniprogram/project.config.json`（已写入 `wx3352b8a1a284fe46`）。

## 2. 在微信小程序后台必须配置的白名单
（在「设置 / 开发设置 / 服务器域名」或「开发设置 / 下载文件域名」中配置）

- 请求域名（request）: e.g. `https://api.tuc.edu.cn`  
- 上传域名（uploadFile）: e.g. `https://upload.tuc.edu.cn` （若后端需要）  
- 下载文件域名（downloadFile）: 模型 CDN 域名 `https://cdn.tuc.edu.cn`（**必须**添加，否则 `wx.downloadFile` 会失败）  
- WebSocket 域名（若使用socket）: `wss://...`  
- 小程序后台示例（请按实际域名替换）

> 提示：域名必须使用 https，且不要包含路径（只填写 host），例如 `https://cdn.tuc.edu.cn`。

## 3. 模型压缩与上传（推荐自动化）
1. 使用 `scripts/compress-models.js` 压缩 GLB（或使用 gltfpack/gltf-pipeline）：

```bash
# 示例：压缩并输出
node scripts/compress-models.js models/main_gate.glb models/main_gate.draco.glb
```

2. 上传到 OSS/S3 并设置公共读取（或 CDN 后端）：

```bash
# AWS S3 示例
aws s3 cp models/main_gate.draco.glb s3://your-bucket/models/ --acl public-read
```

3. 记录最终文件的 public URL（例如 `https://cdn.tuc.edu.cn/models/main_gate.draco.glb`）。

## 4. 生成 manifest（包含版本和 sha256）
示例 manifest 条目应包含 `download_url`、`version` 与 `sha256`：

```json
{
  "id": "main_gate",
  "lod": {
    "lod2": { "download_url": "https://cdn.tuc.edu.cn/models/main_gate_lod2.glb", "version": "1.0", "sha256": "..." }
  }
}
```

计算 sha256（Linux / macOS 示例）：
```bash
shasum -a 256 models/main_gate.draco.glb | awk '{print $1}'
# 或 openssl
openssl dgst -sha256 -binary models/main_gate.draco.glb | openssl base64
```

把生成的 `sha256` 写入 manifest（用于小程序端进行版本/完整性校验）。

## 5. 更新仓库和配置
- 更新 `manifests/campus_manifest.example.json`（或 `miniprogram/manifests/campus_manifest.json`）为生产 URL 与版本号。  
- 确保 `miniprogram/project.config.json` 中 `appid` 为 `wx3352b8a1a284fe46`。  
- 如需，也可以在 `miniprogram/app.js` 的 `globalData` 中写入 `baseDownloadUrl` 指向 CDN。

## 6. 提交前自动化检查（本地）
1. 在项目根执行：
```bash
npm install
npm run test   # 会跑 scripts/test-miniprogram.js 做基本检查
```
2. 验证 manifest 格式、模型 URL 可访问、sha256 正确。

## 7. 真机测试（必做）
- 在微信开发者工具中用正式 AppID 导入并编译，使用真机预览（扫码）进行以下测试：  
  - 首次启动：manifest 下载 → 模型下载 → 本地加载（确认进度/错误提示正常）  
  - 重启/缓存检查：已缓存模型使用本地路径加载，无重复下载（版本不变）  
  - 性能检查：记录首次加载时间、平均 FPS、内存占用（代表性设备至少 3 台）

## 8. 提审清单（上传到微信后台前逐项确认）
- [ ] AppID 已替换为 `wx3352b8a1a284fe46`（`project.config.json`）  
- [ ] 服务器域名 / 下载域名 已在小程序后台配置并生效（https）  
- [ ] manifest 中的 `download_url` 全部为生产 CDN 地址，且可访问  
- [ ] 每个模型条目包含 `version` 与 `sha256` 并校验通过  
- [ ] 模型文件大小、LOD、压缩策略符合性能指标（单文件目标 < 5MB）  
- [ ] 在真机上测试通过（加载、渲染、交互、内存、FPS）  
- [ ] 如果使用云开发：云函数、数据库及权限已在微信后台配置并测试通过  
- [ ] README / DEPLOYMENT 文档已更新并包含 AppID 与白名单说明

## 9. 回滚策略（简要）
- 如果线上出现模型问题：回滚 manifest 到前一个稳定版本（保留旧 `download_url` 或 指向备份 CDN）并发布小程序后台更新。  
- 紧急热修复：修改 manifest 指向备用资源，并在 MDN/后台说明部署时间窗口。

## 10. 常见问题快速排查
- `wx.downloadFile` 失败：检查下载域名是否在微信后台的“下载文件域名”白名单；确认 URL 使用 https。  
- 模型加载报错：用 Three.js 在本地复现加载错误并检查 glTF 是否损坏或缺少 anchor。  
- token/login 相关：请用正式 AppID 做真机测试，游客 AppID 会产生 INVALID_LOGIN。

---

如果你同意，我可以：
- 把 manifest 的 `download_url` 升级为生产 CDN（根据你给的域名），并自动计算 sha256（你提供上传后的文件或 URL）；或者我可以输出一个脚本来批量计算并更新 manifest。


