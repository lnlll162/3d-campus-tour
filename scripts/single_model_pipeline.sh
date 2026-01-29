#!/usr/bin/env bash
#
# 单模型处理流水脚本（示例: logo.glb）
# 用途：验证 -> Draco 压缩 -> 前端验证 (检查能否被 gltf-validator 和本地 dev server 加载)
#
# 先决条件（本机需已安装）：
# - gltf-validator (npm i -g @khronosgroup/gltf-validator)
# - gltf-pipeline (npm i -g gltf-pipeline)
# - curl 或 wget（用于本地加载验证）

set -euo pipefail

MODEL_PATH="${1:-web/models/logo.glb}"
OUT_DIR="${2:-web/models/processed}"
DRACO_OUT="$OUT_DIR/$(basename "${MODEL_PATH%.*}").draco.glb"

mkdir -p "$OUT_DIR"

echo "1) 验证模型: $MODEL_PATH"
gltf-validator "$MODEL_PATH" --summary
echo "验证完成。"

echo "2) 使用 gltf-pipeline 进行 Draco 压缩 -> $DRACO_OUT"
gltf-pipeline -i "$MODEL_PATH" -o "$DRACO_OUT" -d
echo "Draco 压缩完成。"

echo "3) 本地验证压缩后的文件"
gltf-validator "$DRACO_OUT" --summary
echo "压缩后模型验证完成。"

echo "4) 前端加载验证（尝试通过 localhost:5173 加载模型 URL）"
MODEL_URL="http://localhost:5173/$(echo "$DRACO_OUT" | sed -e 's/^web\\///')"
echo "尝试访问 $MODEL_URL"

# 尝试短连接检测（返回 HTTP 状态）
if command -v curl >/dev/null 2>&1; then
  status=$(curl -s -o /dev/null -w "%{http_code}" "$MODEL_URL" || echo "000")
  echo "HTTP 状态: $status"
else
  echo "未检测到 curl，跳过 HTTP 检查。"
fi

echo "流水完成。结果文件： $DRACO_OUT"
echo "后续：若校验和前端加载正常，可将 $DRACO_OUT 上传到 CDN 并更新 manifest。"





