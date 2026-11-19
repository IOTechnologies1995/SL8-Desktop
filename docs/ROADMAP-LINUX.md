# SL8 Linux Roadmap

## Milestone 0: Distribution foundation
- [x] Establish a separate distro build branch.
- [x] Add Debian Live Build configuration for amd64.
- [x] Define a reproducible VM-first build workflow.
- [ ] Run the first ISO build on a Debian 13 host.
- [ ] Boot-test the image in VirtualBox.

## Milestone 1: SL8 desktop runtime
- [ ] Select and implement the desktop host runtime for the existing React UI.
- [ ] Launch the SL8 shell automatically at login.
- [ ] Preserve a recoverable KDE session during development.
- [ ] Add SL8 branding, wallpapers, session metadata, and login experience.

## Milestone 2: Native system integration
- [ ] Replace simulated file operations with safe Linux filesystem APIs.
- [ ] Connect terminal UI to a real user shell.
- [ ] Connect settings to supported system services and DBus interfaces.
- [ ] Add application discovery and launching.
- [ ] Add network status and controls through NetworkManager.
- [ ] Design a narrow, permission-checked system service. Never expose unrestricted root access to the UI.

## Milestone 3: Installer and release engineering
- [ ] Evaluate Calamares integration after the first live image is stable.
- [ ] Add SL8 artwork, release metadata, checksums, and build documentation.
- [ ] Add automated build validation.
- [ ] Test installation, upgrades, recovery, and hardware compatibility.

## Alpha 1 definition of done

A bootable x86_64 live ISO that starts reliably in a virtual machine, provides a working desktop and network connection, and offers a tested installation path onto a disposable virtual disk. The existing SL8 React desktop is integrated only after the base image is repeatable.
