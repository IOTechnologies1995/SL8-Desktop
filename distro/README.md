# SL8 Linux Distribution

This directory contains the first Linux distribution build scaffold for SL8.

## Alpha 1 strategy

- Base: Debian 13 (Trixie).
- Image builder: Debian Live Build.
- Initial session: KDE Plasma on X11 as a reliable fallback while the native SL8 shell is developed.
- Installer: Debian Installer in live-image mode for the first bootable milestone.
- Target: x86_64 virtual machines first.

The existing React application remains the design reference and will be integrated as the SL8 desktop shell in a later phase. It is not yet a native desktop environment, and this scaffold does not pretend that simulated apps are already connected to Linux services.

## Build

Run the build on a Debian 13 (Trixie) amd64 machine or VM. Building inside a clean Debian VM is recommended.

```bash
sudo bash ./distro/scripts/build-iso.sh
```

The script installs the required build dependency if it is missing, configures the live image, and invokes `lb build`. The resulting ISO is produced in the build workspace.

See [BUILDING.md](BUILDING.md) for prerequisites, output details, and troubleshooting.

## Safety

Do not test the ISO by installing it onto your everyday computer. Boot it in VirtualBox, VMware, or another disposable VM first. The first milestone is for validation, not daily-driver use.
