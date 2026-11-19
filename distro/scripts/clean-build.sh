#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK_DIR="$ROOT_DIR/distro/build"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run this script with sudo:" >&2
  exit 1
fi

if [[ -d "$WORK_DIR" ]]; then
  cd "$WORK_DIR"
  lb clean --purge || true
  cd "$ROOT_DIR"
  rm -rf -- "$WORK_DIR"
  echo "Removed SL8 live-build workspace."
else
  echo "No build workspace exists yet."
fi
