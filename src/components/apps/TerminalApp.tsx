import React, { useEffect, useRef, useState } from 'react';
import { AppId, OSSettings, SecurityState, UbuntuPackage, VirtualFile } from '../../types/os';

interface TerminalAppProps {
  files: VirtualFile[];
  security: SecurityState;
  settings: OSSettings;
  packages: UbuntuPackage[];
  onCreateFile: (parentPath: string, name: string, type: 'file' | 'folder', content?: string) => void;
  onDeleteFile: (path: string) => void;
  onLaunchApp: (appId: AppId) => void;
}

interface TermLine {
  id: string;
  text: string;
  tone?: 'normal' | 'cyan' | 'muted' | 'error';
}

const NEOFETCH_LINES = [
  '        .-/+oossssoo+/-.              sl8@sl8-workstation',
  '    `:+ssssssssssssssssss+:`          -------------------',
  '  -+ssssssssssssssssssyyssss+-        OS: SL8 DSK Experimental Build (Ubuntu 26.04 LTS)',
  ' .ossssssssssssssssssdMMMNysssso.     Kernel: 6.12.8-sl8-hardened x86_64',
  '/ssssssssssshdmmNNmmyNMMMMhssssss/    Shell: bash 5.2.32 (SL8 Hardened)',
  '+ssssssssshmydMMMMMMMNddddyssssssss+  DE: SL8 Sharp Frosted Glass (Wayland)',
  '/sssssssshNMMMyhhyyyyhmNMMMNhssssssss/Browser: NetCom (Chromium Shield Engine)',
  '.ssssssssdMMMNhsssssssssshNMMMdssssss.Media: ZHD2 Player · Spotify · Steam',
  '+sssshhhyNMMNyssssssssssssyNMMMyssss+ Defense: Centurion (nftables + AppArmor + WG)',
];

export const TerminalApp: React.FC<TerminalAppProps> = ({
  files,
  security,
  settings,
  packages,
  onCreateFile,
  onDeleteFile,
  onLaunchApp,
}) => {
  const [cwd, setCwd] = useState('/home/sl8');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['neofetch', 'centurion']);
  const [histIdx, setHistIdx] = useState(-1);
  const [lines, setLines] = useState<TermLine[]>([
    { id: 'init-1', text: 'SL8 DSK Experimental Build (Ubuntu 26.04 LTS · Linux 6.12.8-sl8-hardened)', tone: 'cyan' },
    { id: 'init-2', text: 'Centurion Host Defense Active · Zero-Telemetry Profile Enforced', tone: 'muted' },
    { id: 'init-3', text: 'Type "help" for available commands, or "neofetch" for system info.', tone: 'muted' },
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const append = (entries: Array<{ text: string; tone?: TermLine['tone'] }>) => {
    setLines((prev) => [
      ...prev,
      ...entries.map((e, i) => ({ id: `${Date.now()}-${i}-${Math.random()}`, ...e })),
    ]);
  };

  const resolvePath = (raw: string): string => {
    if (!raw || raw === '~') return '/home/sl8';
    if (raw.startsWith('~/')) return `/home/sl8/${raw.slice(2)}`;
    if (raw.startsWith('/')) return raw.replace(/\/+$/, '') || '/';
    if (raw === '..') {
      const parts = cwd.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    return `${cwd === '/' ? '' : cwd}/${raw}`.replace(/\/+/g, '/');
  };

  const execute = (rawCmd: string) => {
    const cmdLine = rawCmd.trim();
    const promptPath = cwd.replace('/home/sl8', '~');
    append([{ text: `${settings.username}@${settings.hostname}:${promptPath}$ ${cmdLine}`, tone: 'cyan' }]);
    if (!cmdLine) return;

    setHistory((prev) => [cmdLine, ...prev]);
    setHistIdx(-1);

    const parts = cmdLine.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'help') {
      append([
        { text: 'Available Ubuntu & SL8 commands:', tone: 'normal' },
        { text: '  neofetch        Display SL8 DSK Experimental Build system summary', tone: 'muted' },
        { text: '  ls [path]       List directory contents', tone: 'muted' },
        { text: '  cd <dir>        Change working directory', tone: 'muted' },
        { text: '  pwd             Print working directory', tone: 'muted' },
        { text: '  cat <file>      Print file contents', tone: 'muted' },
        { text: '  mkdir <name>    Create directory', tone: 'muted' },
        { text: '  touch <name>    Create empty file', tone: 'muted' },
        { text: '  rm <name>       Delete file or folder', tone: 'muted' },
        { text: '  centurion       Inspect Centurion firewall, WireGuard, and kernel flags', tone: 'muted' },
        { text: '  ufw status      List active nftables/UFW rules', tone: 'muted' },
        { text: '  netcom / zhd2   Launch NetCom Browser or ZHD2 Media Player', tone: 'muted' },
        { text: '  spotify / steam Launch Spotify or Steam (Linux / Proton)', tone: 'muted' },
        { text: '  calc / calendar Launch Calculator, Calendar, or notes', tone: 'muted' },
        { text: '  apt list        List installed Ubuntu packages', tone: 'muted' },
        { text: '  apt update      Refresh hardened Ubuntu repositories', tone: 'muted' },
        { text: '  uname -a        Show Linux kernel version', tone: 'muted' },
        { text: '  ip a            Display network interfaces', tone: 'muted' },
        { text: '  clear           Clear terminal output', tone: 'muted' },
      ]);
      return;
    }

    if (cmd === 'neofetch' || cmd === 'fastfetch') {
      append(NEOFETCH_LINES.map((l) => ({ text: l, tone: 'normal' })));
      return;
    }

    const launchMap: Record<string, { id: AppId; msg: string }> = {
      netcom: { id: 'netcom', msg: 'Launching NetCom Browser under sl8-netcom.apparmor profile...' },
      zhd2: { id: 'zhd2', msg: 'Launching ZHD2 Media Player in isolated Bubblewrap sandbox...' },
      spotify: { id: 'spotify', msg: 'Launching Spotify Desktop (Flatpak sandbox)...' },
      steam: { id: 'steam', msg: 'Launching Steam Linux / Proton runtime...' },
      calc: { id: 'calculator', msg: 'Opening SL8 Calculator...' },
      calculator: { id: 'calculator', msg: 'Opening SL8 Calculator...' },
      calendar: { id: 'calendar', msg: 'Opening SL8 Calendar...' },
      notes: { id: 'notes', msg: 'Opening SL8 Notes...' },
    };

    if (launchMap[cmd]) {
      onLaunchApp(launchMap[cmd].id);
      append([{ text: launchMap[cmd].msg, tone: 'cyan' }]);
      return;
    }

    if (cmd === 'pwd') {
      append([{ text: cwd }]);
      return;
    }

    if (cmd === 'whoami') {
      append([{ text: settings.username }]);
      return;
    }

    if (cmd === 'hostname') {
      append([{ text: settings.hostname }]);
      return;
    }

    if (cmd === 'date') {
      append([{ text: new Date().toString() }]);
      return;
    }

    if (cmd === 'uname') {
      append([
        {
          text: 'Linux sl8-workstation 6.12.8-sl8-hardened #1 SMP PREEMPT_DYNAMIC Ubuntu 26.04 x86_64 GNU/Linux',
        },
      ]);
      return;
    }

    if (cmd === 'ls') {
      const target = args[0] ? resolvePath(args[0]) : cwd;
      const children = files.filter((f) => f.parentPath === target);
      if (children.length === 0) {
        const exists =
          files.some((f) => f.path === target) ||
          target === '/' ||
          target === '/home' ||
          target === '/etc' ||
          target === '/var';
        if (!exists) {
          append([{ text: `ls: cannot access '${args[0]}': No such file or directory`, tone: 'error' }]);
        } else {
          append([{ text: '(empty directory)', tone: 'muted' }]);
        }
        return;
      }
      append(
        children.map((c) => ({
          text: `${c.permissions}  ${String(c.sizeBytes).padStart(8, ' ')}  ${c.updatedAt}  ${c.name}${c.type === 'folder' ? '/' : ''}${c.encrypted ? ' [AES-256]' : ''}`,
          tone: c.type === 'folder' ? 'cyan' : 'normal',
        }))
      );
      return;
    }

    if (cmd === 'cd') {
      const target = resolvePath(args[0] || '~');
      const isValidFolder =
        target === '/' ||
        target === '/home' ||
        target === '/etc' ||
        target === '/var' ||
        files.some((f) => f.path === target && f.type === 'folder');
      if (!isValidFolder) {
        append([{ text: `bash: cd: ${args[0]}: No such directory`, tone: 'error' }]);
        return;
      }
      setCwd(target);
      return;
    }

    if (cmd === 'cat') {
      if (!args[0]) {
        append([{ text: 'Usage: cat <filename>', tone: 'error' }]);
        return;
      }
      const target = resolvePath(args[0]);
      const file = files.find((f) => f.path === target && f.type === 'file');
      if (!file) {
        append([{ text: `cat: ${args[0]}: No such file`, tone: 'error' }]);
        return;
      }
      if (file.encrypted) {
        append([
          { text: `[Vault Lock] ${file.name} is AES-256 encrypted. Unlock in Vault Explorer to inspect plaintext.`, tone: 'muted' },
        ]);
        return;
      }
      append((file.content || '').split('\n').map((line) => ({ text: line })));
      return;
    }

    if (cmd === 'mkdir') {
      if (!args[0]) {
        append([{ text: 'Usage: mkdir <foldername>', tone: 'error' }]);
        return;
      }
      onCreateFile(cwd, args[0], 'folder');
      append([{ text: `Created directory ${cwd}/${args[0]}`, tone: 'muted' }]);
      return;
    }

    if (cmd === 'touch') {
      if (!args[0]) {
        append([{ text: 'Usage: touch <filename>', tone: 'error' }]);
        return;
      }
      onCreateFile(cwd, args[0], 'file', '');
      append([{ text: `Created file ${cwd}/${args[0]}`, tone: 'muted' }]);
      return;
    }

    if (cmd === 'rm') {
      if (!args[0]) {
        append([{ text: 'Usage: rm <name>', tone: 'error' }]);
        return;
      }
      const target = resolvePath(args[0]);
      const exists = files.some((f) => f.path === target);
      if (!exists) {
        append([{ text: `rm: cannot remove '${args[0]}': No such file or directory`, tone: 'error' }]);
        return;
      }
      onDeleteFile(target);
      append([{ text: `Removed ${target}`, tone: 'muted' }]);
      return;
    }

    if (cmd === 'centurion' || cmd === 'security' || cmd === 'sl8-security') {
      if (args[0] === 'open') {
        onLaunchApp('centurion');
        append([{ text: 'Opening Centurion Host Defense UI...', tone: 'cyan' }]);
        return;
      }
      append([
        { text: 'Centurion Host Defense Daemon — Active', tone: 'cyan' },
        { text: `  nftables Firewall : ${security.firewallEnabled ? 'ACTIVE' : 'DISABLED'} (Default IN: ${security.firewallDefaultInbound})` },
        { text: `  WireGuard Tunnel  : ${security.vpnEnabled ? `CONNECTED (${security.vpnExitNode})` : 'DISCONNECTED'}` },
        { text: `  DNSSEC / DoH      : ${security.dnsProvider}` },
        { text: `  Camera / Mic Cut  : ${security.killSwitches.camera ? 'LOCKED' : 'OPEN'} / ${security.killSwitches.microphone ? 'LOCKED' : 'OPEN'}` },
        { text: `  AppArmor Enforced : ${security.kernelHardening.apparmorEnforce ? 'YES' : 'NO'} (${security.sandboxes.filter((s) => s.enforced).length} profiles)` },
      ]);
      return;
    }

    if (cmd === 'ufw') {
      append([
        { text: `Status: ${security.firewallEnabled ? 'active' : 'inactive'}`, tone: 'cyan' },
        ...security.firewallRules
          .filter((r) => r.enabled)
          .map((r) => ({
            text: `  ${(r.port + '/' + r.protocol).padEnd(12, ' ')} ${r.action.padEnd(7, ' ')} ${r.direction.padEnd(4, ' ')} # ${r.service}`,
          })),
      ]);
      return;
    }

    if (cmd === 'ip') {
      append([
        { text: '1: lo: <LOOPBACK,UP> mtu 65536 inet 127.0.0.1/8' },
        { text: `2: wlp3s0: <BROADCAST,UP> mtu 1500 link/ether ${security.kernelHardening.macRandomize ? 'ae:4f:9c:21:08:d4 (randomized)' : '44:8a:5b:10:22:ef'}` },
        { text: `3: wg0: <POINTOPOINT,${security.vpnEnabled ? 'UP' : 'DOWN'}> mtu 1420 inet 10.8.0.14/32 scope global wg0`, tone: 'cyan' },
      ]);
      return;
    }

    if (cmd === 'apt') {
      if (args[0] === 'update') {
        append([
          { text: 'Hit:1 https://repo.sl8-os.org/ubuntu noble-hardened InRelease', tone: 'muted' },
          { text: 'Hit:2 https://security.ubuntu.com/ubuntu noble-security InRelease', tone: 'muted' },
          { text: 'Reading package lists... Done' },
          { text: 'All SL8 hardened packages are up to date.', tone: 'cyan' },
        ]);
        return;
      }
      const installed = packages.filter((p) => p.installed);
      append([
        { text: `Installed Ubuntu packages (${installed.length}):`, tone: 'cyan' },
        ...installed.map((p) => ({
          text: `  ${p.pkgName.padEnd(22, ' ')} ${p.version.padEnd(14, ' ')} [${p.source}]`,
        })),
      ]);
      return;
    }

    append([{ text: `bash: ${cmd}: command not found. Type "help" for commands.`, tone: 'error' }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      execute(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(history.length - 1, histIdx + 1);
        setHistIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) {
        setHistIdx(-1);
        setInput('');
      } else {
        const nextIdx = histIdx - 1;
        setHistIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="h-full flex flex-col bg-[#06080C] font-mono text-xs text-[#D5DCE6] p-4 overflow-hidden cursor-text"
    >
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {lines.map((line) => (
          <pre
            key={line.id}
            style={line.tone === 'cyan' ? { color: 'var(--sl8-accent)' } : undefined}
            className={`whitespace-pre-wrap break-words leading-relaxed font-mono ${
              line.tone === 'cyan'
                ? ''
                : line.tone === 'muted'
                ? 'text-[#7F8B9B]'
                : line.tone === 'error'
                ? 'text-red-400'
                : 'text-[#E6EAF0]'
            }`}
          >
            {line.text}
          </pre>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <span className="shrink-0" style={{ color: 'var(--sl8-accent)' }}>
            {settings.username}@{settings.hostname}:{cwd.replace('/home/sl8', '~')}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            aria-label="Terminal command input"
            className="flex-1 bg-transparent text-white focus:outline-none font-mono"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
};
