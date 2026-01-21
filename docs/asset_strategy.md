# 资产管理与模型发布策略（Asset Strategy）

此文档汇总了 3D 校园项目中关于模型拆分、LOD、压缩、托管与前端按需加载的推荐实践，便于团队遵循统一流程并保证性能与可维护性。

## 概要
- 不要把整个校园导出为单个超大 GLB 文件。建议按建筑/功能区分块（分区模型），并为每个模型提供 LOD（细节级别）。
- 大型模型应托管在对象存储/CDN（阿里 OSS / 腾讯 COS / AWS S3），仓库中仅保留 `manifest`、示例小模型与加载逻辑。

## 模型拆分（必做）
- 建议按建筑或功能区导出模型，例如：`library.glb`, `dormitory.glb`, `sports.glb`。
- 优点：并行建模、按需加载、替换简单、回滚容易。

## LOD（细节级别）
- 每个模型至少提供两级 LOD（近/远），推荐三层：LOD0（高）、LOD1（中）、LOD2（低）。
- 使用 Three.js 的 `THREE.LOD` 或自定义距离检测进行切换。

## 网格与纹理压缩（必做）
- 网格压缩：推荐使用 Draco 或 meshoptimizer（glTF 扩展）。
- 纹理压缩：推荐使用 Basis Universal（KTX2）以减低 GPU 内存占用并提升加载速度。

## 托管（强烈推荐）
- 将压缩后的模型上传到对象存储并通过 CDN 加速访问。
- 仓库仅保留 `manifest` 文件，manifest 指向各个模型的 URL 与 LOD 路径。

## manifest 示例（见 manifests/campus_manifest.example.json）
- manifest 描述各区域的 bounding box、LOD URL、优先级等信息，前端根据相机位置与视锥决定加载哪些区域。

## 前端加载（概念）
1. 首先加载 `manifest`（JSON）。  
2. 根据相机位置和视锥进行 AABB 相交判断，决定需要加载的区域。  
3. 对于需加载的区域，先加载低精度 LOD（占位），随后并行请求更高精度 LOD 并替换。  
4. 使用 `GLTFLoader + DRACOLoader + KTX2Loader`（Three.js）进行加载，使用资源池与缓存机制避免重复加载。

## 小程序注意事项
- 小程序包体积有限，**不要把大模型打包进代码包**。应在运行时下载并缓存模型（`wx.getFileSystemManager` 保存到本地），并提供版本校验与更新机制。
- 推荐使用原生 WebGL 或 three-miniprogram 适配器。
小程序特有要求（扩展）
- Manifest 字段：为支持小程序，manifest 中应包含 `download_url`（模型远端地址）、`version`（版本号）和 `platform`（例如 `["web","miniprogram"]`）。小程序端使用这些字段决定是否需要下载/更新本地缓存。  
- 本地缓存：最佳实践是把下载后的文件存放到小程序的临时或永久文件系统，并记录版本与文件名；在启动时检查 manifest 与本地版本是否匹配再决定是否重新下载。  
- 下载与并发控制：限制同时下载的模型数（例如并发 2 个），优先加载摄像机附近或高优先级区域。  
- 本地加载路径：小程序加载器应支持从本地路径（`file://` 风格）读取 glb，并可回退到远端 URL（开发时）。  
- 调试建议：先在微信开发者工具的“预览”模式中验证本地加载逻辑，再在真机上做性能测试。  

## 本地/CI 检查与自动化
- CI 可对模型进行基本校验（是否能被 GLTFLoader 解析、纹理是否缺失）。  
- 可在构建流程中自动运行 `gltf-pipeline` 进行压缩与优化。

## Checklist（交付前）
- [ ] 已按区域拆分并命名模型  
- [ ] 每个模型提供 LOD（0/1/2）  
- [ ] 使用 Draco/meshopt 对网格进行压缩  
- [ ] 使用 Basis/KTX2 对纹理进行压缩  
- [ ] 模型已上传到 CDN/OSS，并生成 manifest  
- [ ] 前端实现按需加载与缓存逻辑

---  
如需示例 manifest、loader 示例或上传脚本，请参见项目根目录中的 `manifests/`、`web/js/loader.example.js` 与 `scripts/upload_to_storage_example.sh`。


