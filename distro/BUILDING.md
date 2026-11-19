# Building SL8 Alpha 1

## Requirements

- Debian 13 (Trixie), amd64.
- Internet connection.
- 20 GB or more free disk space.
- 4 GB RAM minimum; 8 GB recommended.
- A user account with sudo access.

A clean Debian virtual machine is the recommended build host. Do not run the build from Windows/WSL as the initial supported workflow.

## Build

From the repository root:

```bash
sudo bash ./distro/scripts/build-iso.sh
```

The script creates an isolated workspace at `distro/build/`, copies the live-build configuration into it, and runs the build there. The generated ISO and build log remain in that workspace.

To clean the workspace before a fresh build:

```bash
sudo bash ./distro/scripts/clean-build.sh
```

## Boot testing

1. Create a new VirtualBox VM with Linux (Debian 64-bit).
2. Assign at least 4 GB RAM and 2 CPU cores.
3. Attach the generated ISO as the optical drive.
4. Boot the live environment first.
5. Check graphics, keyboard, mouse, networking, audio, and shutdown.
6. Only test the installer against a disposable virtual disk.

## Current limitations

This is the distro foundation, not a finished SL8 operating system. The first image uses KDE Plasma as a stable fallback desktop and Debian Installer for installation. The React SL8 interface, real system settings, native file operations, application launching, and a controlled privileged system bridge are subsequent integration milestones.
