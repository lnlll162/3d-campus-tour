#!/usr/bin/env bash
#
# Example: upload optimized models to AWS S3 or Alibaba OSS / Tencent COS.
# Edit the bucket/path and credentials as needed.

set -e

echo "Uploading models to storage..."

# === AWS S3 example (requires awscli configured) ===
# aws s3 sync manifests/ s3://your-bucket/models/manifests --acl public-read
# aws s3 sync models/ s3://your-bucket/models/ --acl public-read

# === Alibaba OSS example (requires ossutil) ===
# ossutil cp -r manifests/ oss://your-bucket/models/manifests/ --acl public-read
# ossutil cp -r models/ oss://your-bucket/models/ --acl public-read

# === Tencent COS example (coscmd or coscli) ===
# coscli upload --bucket your-bucket --region your-region --src ./models --dst /models

echo "Done. Update manifests/campus_manifest.example.json with the uploaded URLs."


