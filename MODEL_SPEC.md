# MODEL_SPEC.md — 交付规范（仅外部轮廓 / 校园整体景观）

说明：本规范用于指导建模人员只交付校园外部轮廓（不含室内细节）的 glb 文件，便于前端按区域拼接与后续扩展。请建模人员严格遵守，按要求交付文件与 metadata，以便我们快速集成与验收。

> 注意：本项目已采用 H5-first（web-view + H5）架构，以下规范以 H5/CDN 托管与 Three.js 加载为主，小程序仅作为容器通过 web-view 加载 H5 页面（legacy 小程序原生实现已归档）。

一、项目与目标
- 项目：3D 校园云旅游（当前阶段：校园整体外部景观/外壳建模）  
- 目标交付：每栋建筑/功能区的外部轮廓 glb（含 LOD） + 对应 metadata（JSON）

二、坐标、单位与朝向
- 坐标系：右手坐标系（Three.js 默认）  
- 轴向：Y 轴向上  
- 单位：米（1 单位 = 1 米）  
- 模型本地原点：建议使用建筑底面中心或入口处作为原点（在 metadata 中说明）

三、文件命名与目录结构
- 命名规范（必须）：
  - `<id>_exterior_lod0.glb`  // 高精度（近）
  - `<id>_exterior_lod1.glb`  // 中精度
  - `<id>_exterior_lod2.glb`  // 低精度（远/占位）
- 示例目录：
  - models/library/library_exterior_lod0.glb
  - models/library/library_exterior_lod1.glb
  - models/library/library_exterior_lod2.glb
  - models/library/library.json  // metadata

四、LOD 要求（最小）
- LOD2（远/占位）：低面数，快速可视（建议 < 2k 面）  
- LOD1（中）：中等面数（2k–5k）  
- LOD0（近/展示）：尽量控制在 5k–15k 面（依建筑复杂度可调整）

五、几何与拓扑
- 只需外壳（外墙、屋顶、阳台、台阶、主要外构件），内部可以为空心或省略。  
- 清理隐藏面和内部不可见面以节省面数。  
- 面法线方向正确，避免翻转。  
- UV 展开：主要用于 BaseColor（若无复杂纹理，允许简单上色）。

六、材质与纹理
- BaseColor（颜色贴图）建议分辨率：512 或 1024（外壳用低分辨率即可）。  
- PBR 通道（可选）：BaseColor(sRGB)、Normal、Roughness、Metallic、AO（非必须）。  
- 如果只做单色或简单着色，请在 metadata 中注明颜色信息。

七、锚点与交互节点（必需）
- 在建模文件中包含命名空节点或空物体（empty nodes），例如：
  - `anchor_origin`（模型放置基点）  
  - `hotspot_mainEntrance`（交互热点）  
- 前端通过这些命名节点读取位置用于对齐与交互。

八、碰撞代理（可选）
- 若需要简单行走或碰撞检测，请额外提供低面数碰撞代理文件：`collision_<id>.glb`。

九、元数据（JSON）
- 每个模型目录提交一个 metadata JSON，示例：
```
{
  "id": "library",
  "name": "图书馆",
  "bbox": [-10,0,-5, 10,20,5],
  "origin": [25,0,10],   // world position
  "lod": ["library_exterior_lod0.glb","library_exterior_lod1.glb","library_exterior_lod2.glb"],
  "hotspots": ["hotspot_mainEntrance"],
  "notes": "外部轮廓，仅含屋顶与外墙，内部省略"
}
```

十、交付方式与命名约定
- 推荐上传到我们指定的 OSS/CDN（我们会提供上传说明或临时凭证）。  
- 如无法上传，请通过网盘/私有链接提交（注明文件名与路径）。  
- 若在本地测试，确保文件能被 Three.js `GLTFLoader` 加载无报错。

十一、自检与验收标准（建模师必须自检）
- GLB 文件能被 `GLTFLoader` 成功加载（无 console 报错）。  
- 模型尺寸与 metadata 中说明一致；朝向与 campus reference 一致。  
- LOD 命名与文件存在且完整。  
- 命名节点存在且位置准确。  
- 贴图贴合、无严重拉伸，文件体积在可接受范围。

十二、示例交付流程（建议）
1. 提交样例：先提交一个样例建筑（例如主校门或图书馆外壳的 LOD2 + metadata）供前端集成测试。  
2. 前端集成：我们测试样例并回馈问题（若有）进行修正。  
3. 批量交付：样例通过后，按区域或批次交付其它建筑。

十四、H5 + web-view架构说明（必读）
- **新架构变更**: 项目采用web-view + H5混合架构，3D渲染在H5端进行
- **模型加载**: 模型直接通过H5的GLTFLoader加载，无需小程序本地缓存
- **部署策略**: 模型文件部署到CDN，小程序通过web-view访问H5页面
- **兼容性**: 保持原有GLTF/GLB格式和LOD规范，H5端Three.js完全支持

**平台支持**: `["web"]`（H5端为主；小程序通过 web-view 加载 H5 页面）
十三、沟通与问题反馈
- 在每次提交的 Issue 中注明：模型 ID、上传路径、主要变更点、预计问题点。  
- 如有不确定的对齐或原点位置，先联系并我们提供参考坐标或示例场景。

---------------------------------------



