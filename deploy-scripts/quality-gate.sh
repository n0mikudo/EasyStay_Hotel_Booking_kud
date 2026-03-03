#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$ROOT_DIR/client-mobile"
ADMIN_DIR="$ROOT_DIR/admin-pc"

print_step() {
  echo ""
  echo "==== $1 ===="
}

print_resource() {
  free -h
  echo "---"
  swapon --show || true
}

print_step "资源快照"
print_resource

print_step "Mobile Build"
CI= npm run build --prefix "$MOBILE_DIR"

print_step "Admin Typecheck"
npm run typecheck --prefix "$ADMIN_DIR"

print_step "Admin Build"
CI= npm run build --prefix "$ADMIN_DIR"

print_step "质量门禁通过"
echo "All quality checks passed."
