#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$ROOT_DIR/client-mobile"
ADMIN_DIR="$ROOT_DIR/admin-pc"

MIN_AVAILABLE_MEM_MB="${MIN_AVAILABLE_MEM_MB:-350}"

print_resource() {
  echo ""
  echo "==== Resource Snapshot ===="
  free -h
  echo "---"
  swapon --show || true
  echo "==========================="
  echo ""
}

check_memory_guard() {
  local available_mb
  available_mb="$(free -m | awk '/Mem:/ {print $7}')"
  if [[ -z "$available_mb" ]]; then
    echo "[WARN] 无法读取可用内存，继续执行。"
    return 0
  fi
  if (( available_mb < MIN_AVAILABLE_MEM_MB )); then
    echo "[ERROR] 可用内存仅 ${available_mb}MB，低于阈值 ${MIN_AVAILABLE_MEM_MB}MB。"
    echo "请先释放内存或提高 MIN_AVAILABLE_MEM_MB 后重试。"
    exit 1
  fi
  echo "[OK] 可用内存 ${available_mb}MB >= 阈值 ${MIN_AVAILABLE_MEM_MB}MB"
}

echo "[1/6] 构建前资源检查"
print_resource
check_memory_guard

echo "[2/6] 构建 mobile (CI=)"
CI= npm run build --prefix "$MOBILE_DIR"

echo "[3/6] mobile 构建后资源检查"
print_resource
check_memory_guard

echo "[4/6] admin typecheck + build"
npm run typecheck --prefix "$ADMIN_DIR"
CI= npm run build --prefix "$ADMIN_DIR"

echo "[5/6] 全量构建后资源检查"
print_resource

echo "[6/6] 完成：quality build 全通过"
