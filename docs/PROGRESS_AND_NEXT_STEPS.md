## 当前进度与后续步骤（概览）

本文档用于记录项目当前状态、已完成工作、优先级任务和可直接执行的操作命令，便于团队快速上手与推进模型交付流水线。

---

### 1) 当前高层状态（快照）
- H5-first 架构已建立（web/ 为 3D 核心，小程序为 web-view 容器）。
- 前端功能已完成：Three.js 场景、相机控制、加载器、UI 控制面板、性能面板、logo.glb 测试加载已成功。
- Node 环境已升级到 Node v18.17.0 并能在本地运行 Vite 开发服务器（localhost:5173）。
- 但项目中的多数真实模型尚未完成（需统一校验、压缩、LOD、托管）。

---

### 2) 已完成（验收）
- Vite 开发服务器启动与热重载 ✅
- 基础场景与交互实现（鼠标、相机、点击、信息面板） ✅
- 测试模型 `logo.glb` 已接入并能正确加载/显示 ✅
- Node 18 已安装到 D:\nodejs 并在当前会话中生效 ✅

---

### 3) 短期目标（本 Sprint，优先级高）
1. 模型规范文档（统一命名、单位、坐标系、纹理通道、面数目标、纹理分辨率）。
2. 生成并维护 `manifests/campus_manifest.json`：列出所有模型、LOD URL、版本信息。
3. 单模型流水（示范）：对 `logo.glb` 做 glTF 验证 → Draco 压缩 → 前端验证（作为模板脚本）。
4. 批量验证脚本：对 web/models 下所有 .glb 执行 gltf-validator 并生成报告（JSON）。

可交付产物：模型规范文档、manifest 示例、单模型处理脚本、批量验证报告。

---

### 4) 中期目标（下 1–2 Sprint）
1. 为大型模型生成 LOD（LOD0/LOD1/LOD2）并在 manifest 中声明 URL。
2. 在构建/CI 中加入模型压缩（gltf-pipeline / gltfpack）与自动上传步骤。
3. 纹理通道转为 KTX2（Basis）以降低显存占用并加速加载。
4. 小程序容器端验证：真机网络下的加载稳定性、postMessage 通信测试。

---

### 5) 长期/增强（可并行）
1. 完整 CI：每次模型更新触发验证 → 压缩 → 上传 → 前端回归加载测试。
2. 性能门禁：自动检测 FPS/内存异常并阻断不合格模型发布。
3. 离线缓存与版本回滚（小程序端）以支持断网回退。

---

### 6) 推荐的工具链与命令（直接可用）
- 安装（一次性）：
```bash
npm install -g @khronosgroup/gltf-validator
npm install -g gltf-pipeline
# gltfpack 可按需下载其可执行文件
```

- 单模型验证（示例）：
```bash
gltf-validator web/models/logo.glb --json > web/models/logo.validation.json
```

- Draco 压缩（示例）：
```bash
gltf-pipeline -i web/models/logo.glb -o web/models/logo.draco.glb -d
```

- 批量验证脚本（示例）：
```bash
for f in web/models/*.glb; do
  gltf-validator "$f" --json > "$f".validation.json
done
```

---

### 9) 单模型流水脚本（使用说明）
脚本路径：`scripts/single_model_pipeline.sh`  
功能：对单个模型执行 验证 → Draco 压缩 → 压缩后验证 → 本地前端可达性检测（HTTP 状态码）。默认示例模型为 `web/models/logo.glb`。

先决条件（请在运行前确认）：
- 已安装 `gltf-validator`（全局）：`npm i -g @khronosgroup/gltf-validator`
- 已安装 `gltf-pipeline`（全局）：`npm i -g gltf-pipeline`
- 本地开发服务器正在运行并能通过 `http://localhost:5173` 访问（用于加载验证）
- 在 Windows 上建议用 Git Bash 或 WSL 运行该脚本；也可根据需要请求 PowerShell 版本的脚本

用法示例：
```bash
# 处理默认模型 (web/models/logo.glb)
./scripts/single_model_pipeline.sh

# 处理指定模型并指定输出目录
./scripts/single_model_pipeline.sh web/models/mybuilding.glb web/models/processed
```

输出：
- 压缩文件会放到 `web/models/processed/`（默认），文件名形如 `logo.draco.glb`
- 验证的 JSON 报告和 HTTP 检查会在终端打印

后续：
- 若脚本运行成功且前端能加载压缩模型，建议把压缩模型上传到 CDN 并更新 `manifests/campus_manifest.json`

### 7) manifest 示例（格式示意）
```json
{
  "models": [
    {
      "id": "library",
      "name": "图书馆",
      "lod": {
        "0": "https://cdn.example.com/3d-campus/library_lod0.glb",
        "1": "https://cdn.example.com/3d-campus/library_lod1.glb",
        "2": "https://cdn.example.com/3d-campus/library_lod2.glb"
      },
      "thumbnail": "https://cdn.example.com/3d-campus/library-thumb.jpg",
      "version": "2026-01-23"
    }
  ]
}
```

---

### 8) 立即要做（我可代为执行）
A. 生成“模型清单 + 批量验证”报告（把 web/models 下所有 .glb 检查并汇总结果）。  
B. 把“单模型流水”脚本化（以 logo.glb 为样例，包含验证 → 压缩 → 前端加载验证）。  

请回复你要我先做 A 还是 B，或要求我把上面的内容写入 README 或其他指定文件中（我可以直接创建/更新文档）。  


