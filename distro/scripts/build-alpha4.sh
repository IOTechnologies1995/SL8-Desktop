#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
DISTRO_DIR="$ROOT_DIR/distro"
WORK_DIR="$DISTRO_DIR/build-alpha4"
CONFIG_DIR="$DISTRO_DIR/alpha4-build"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run this script with sudo:" >&2
  echo "  sudo $0" >&2
  exit 1
fi

if [[ ! -f /etc/debian_version ]]; then
  echo "The supported build host for Alpha 1 is Debian 13 (Trixie) amd64." >&2
  exit 1
fi

if [[ "$(dpkg --print-architecture)" != "amd64" ]]; then
  echo "Alpha 1 currently targets amd64 build hosts." >&2
  exit 1
fi

if ! grep -qE 'trixie|13' /etc/os-release; then
  echo "Warning: this build is configured for Debian 13 (Trixie)." >&2
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends live-build debootstrap squashfs-tools xorriso

mkdir -p "$WORK_DIR"
cp -a "$CONFIG_DIR/." "$WORK_DIR/"
cd "$WORK_DIR"

# GitHub's file upload can leave auto/config without its executable bit.
# live-build only auto-runs this configuration hook when it is executable.
if [[ -f "$WORK_DIR/auto/config" ]]; then
  chmod +x "$WORK_DIR/auto/config"
fi

lb config
lb build 2>&1 | tee "$WORK_DIR/build.log"

echo
echo "Build finished. Look for the ISO in: $WORK_DIR"
