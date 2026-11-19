import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Flame,
  Cpu,
  CameraOff,
  MicOff,
  MapPinOff,
  BluetoothOff,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  Lock,
  Globe,
  Wifi,
  CheckCircle2,
} from 'lucide-react';
import { FirewallRule, SecurityState } from '../../types/os';
import { VPN_EXIT_NODES } from '../../data/initialState';

interface CenturionAppProps {
  security: SecurityState;
  onUpdateSecurity: (updater: (prev: SecurityState) => SecurityState) => void;
}

type CenturionTab = 'overview' | 'firewall' | 'vpn' | 'privacy' | 'kernel';

export const CenturionApp: React.FC<CenturionAppProps> = ({ security, onUpdateSecurity }) => {
  const [tab, setTab] = useState<CenturionTab>('overview');
  const [auditing, setAuditing] = useState(false);

  const [newPort, setNewPort] = useState('');
  const [newProto, setNewProto] = useState<'TCP' | 'UDP' | 'ANY'>('TCP');
  const [newDir, setNewDir] = useState<'IN' | 'OUT'>('IN');
  const [newAction, setNewAction] = useState<'ALLOW' | 'DENY'>('DENY');
  const [newService, setNewService] = useState('');

  const checks = useMemo(() => {
    return [
      {
        id: 'fw',
        label: 'Centurion nftables Packet Filter',
        passed: security.firewallEnabled && security.firewallDefaultInbound === 'DENY',
        detail: security.firewallEnabled ? `Default inbound: ${security.firewallDefaultInbound}` : 'Firewall disabled',
        fix: () =>
          onUpdateSecurity((prev) => ({
            ...prev,
            firewallEnabled: true,
            firewallDefaultInbound: 'DENY',
          })),
      },
      {
        id: 'vpn',
        label: 'WireGuard Encrypted Tunnel',
        passed: security.vpnEnabled && security.vpnKillSwitch,
        detail: security.vpnEnabled
          ? `${security.vpnExitNode} · Kill-switch ${security.vpnKillSwitch ? 'armed' : 'off'}`
          : 'Traffic unencrypted on local gateway',
        fix: () =>
          onUpdateSecurity((prev) => ({
            ...prev,
            vpnEnabled: true,
            vpnKillSwitch: true,
          })),
      },
      {
        id: 'cam',
        label: 'Camera & Microphone Hardware Cut',
        passed: security.killSwitches.camera && security.killSwitches.microphone,
        detail:
          security.killSwitches.camera && security.killSwitches.microphone
            ? 'Capture interfaces blocked at kernel level'
            : 'One or more capture devices accessible',
        fix: () =>
          onUpdateSecurity((prev) => ({
            ...prev,
            killSwitches: { ...prev.killSwitches, camera: true, microphone: true },
          })),
      },
      {
        id: 'tel',
        label: 'Zero-Telemetry Ubuntu Profile',
        passed: security.killSwitches.telemetryBlocked && security.killSwitches.location,
        detail: security.killSwitches.telemetryBlocked ? 'Crash & usage reporting stripped' : 'Telemetry guard relaxed',
        fix: () =>
          onUpdateSecurity((prev) => ({
            ...prev,
            killSwitches: { ...prev.killSwitches, telemetryBlocked: true, location: true },
          })),
      },
      {
        id: 'kernel',
        label: 'Hardened Kernel sysctl Flags',
        passed:
          security.kernelHardening.ptraceScope &&
          security.kernelHardening.kptrRestrict &&
          security.kernelHardening.aslrFull &&
          security.kernelHardening.apparmorEnforce,
        detail: 'ptrace_scope=2 · kptr_restrict=2 · AppArmor enforce',
        fix: () =>
          onUpdateSecurity((prev) => ({
            ...prev,
            kernelHardening: {
              ptraceScope: true,
              kptrRestrict: true,
              aslrFull: true,
              apparmorEnforce: true,
              macRandomize: true,
            },
          })),
      },
      {
        id: 'mac',
        label: 'Network MAC Randomization',
        passed: security.kernelHardening.macRandomize,
        detail: security.kernelHardening.macRandomize ? 'Ephemeral MAC per session' : 'Hardware MAC exposed',
        fix: () =>
          onUpdateSecurity((prev) => ({
            ...prev,
            kernelHardening: { ...prev.kernelHardening, macRandomize: true },
          })),
      },
    ];
  }, [security, onUpdateSecurity]);

  const passedCount = checks.filter((c) => c.passed).length;
  const enforcedSandboxes = security.sandboxes.filter((s) => s.enforced).length;

  const handleRunAudit = () => {
    setAuditing(true);
    setTimeout(() => {
      const now = new Date();
      const stamp = `Today, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      onUpdateSecurity((prev) => ({ ...prev, lastAuditTime: stamp }));
      setAuditing(false);
    }, 450);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPort.trim() || !newService.trim()) return;
    const rule: FirewallRule = {
      id: `rule-${Date.now()}`,
      port: newPort.trim(),
      protocol: newProto,
      direction: newDir,
      action: newAction,
      service: newService.trim(),
      enabled: true,
    };
    onUpdateSecurity((prev) => ({
      ...prev,
      firewallRules: [rule, ...prev.firewallRules],
    }));
    setNewPort('');
    setNewService('');
  };

  const toggleKillSwitch = (key: keyof SecurityState['killSwitches']) => {
    onUpdateSecurity((prev) => ({
      ...prev,
      killSwitches: { ...prev.killSwitches, [key]: !prev.killSwitches[key] },
    }));
  };

  const toggleKernelFlag = (key: keyof SecurityState['kernelHardening']) => {
    onUpdateSecurity((prev) => ({
      ...prev,
      kernelHardening: { ...prev.kernelHardening, [key]: !prev.kernelHardening[key] },
    }));
  };

  return (
    <div className="h-full flex flex-col bg-[#080A0F] text-[#E6EAF0]">
      <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0B0E15] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-display text-base font-semibold text-white tracking-wide">Centurion</h1>
          <p className="text-xs text-[#8E9AA9]">
            Ubuntu 26.04 Host Defense &amp; Privacy · Last audit {security.lastAuditTime}
          </p>
        </div>

        <div className="flex items-center gap-0.5 p-1 rounded-none bg-[#06080C] border border-white/[0.08] overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'Posture' },
              { id: 'firewall', label: 'Firewall' },
              { id: 'vpn', label: 'VPN & DNS' },
              { id: 'privacy', label: 'Kill-Switches' },
              { id: 'kernel', label: 'Kernel & Sandbox' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={tab === item.id ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' } : undefined}
              className={`px-3 py-1.5 rounded-none text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                tab === item.id ? '' : 'text-[#94A0B2] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-none bg-[#0D1119] border border-white/[0.09]">
                <p className="text-xs text-[#8E9AA9]">Hardening Checks</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-semibold text-white tabular-nums">
                    {passedCount} / {checks.length}
                  </span>
                  <span
                    style={passedCount === checks.length ? { color: 'var(--sl8-accent)' } : undefined}
                    className={`text-xs font-medium ${passedCount === checks.length ? '' : 'text-amber-400'}`}
                  >
                    {passedCount === checks.length ? 'Hardened' : 'Review'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-none bg-[#0D1119] border border-white/[0.09]">
                <p className="text-xs text-[#8E9AA9]">Active Firewall Rules</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-semibold text-white tabular-nums">
                    {security.firewallRules.filter((r) => r.enabled).length}
                  </span>
                  <span className="text-xs font-mono text-[#94A0B2]">
                    Inbound: {security.firewallEnabled ? security.firewallDefaultInbound : 'OFF'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-none bg-[#0D1119] border border-white/[0.09]">
                <p className="text-xs text-[#8E9AA9]">AppArmor Sandboxes</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-semibold text-white tabular-nums">
                    {enforcedSandboxes} / {security.sandboxes.length}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--sl8-accent)' }}>
                    Enforcing
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.07]">
              <h2 className="font-display text-sm font-semibold text-white">Centurion Host Checks</h2>
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={auditing}
                style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                className="px-3.5 py-1.5 rounded-none text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 whitespace-nowrap disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
                {auditing ? 'Verifying...' : 'Run Local Audit'}
              </button>
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.09] rounded-none overflow-hidden bg-[#0B0E15]">
              {checks.map((check) => (
                <div key={check.id} className="px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {check.passed ? (
                      <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{check.label}</p>
                      <p className="text-xs text-[#8E9AA9] mt-0.5">{check.detail}</p>
                    </div>
                  </div>
                  {check.passed ? (
                    <span className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--sl8-accent)' }}>
                      <Check className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={check.fix}
                      style={{ backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }}
                      className="px-3 py-1 rounded-none text-xs font-medium hover:opacity-90"
                    >
                      Harden Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'firewall' && (
          <div className="space-y-5">
            <div className="p-4 rounded-none bg-[#0D1119] border border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Flame
                  className="w-5 h-5"
                  style={{ color: security.firewallEnabled ? 'var(--sl8-accent)' : '#6B7687' }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">Centurion Packet Filter (nftables / UFW)</p>
                  <p className="text-xs text-[#8E9AA9]">
                    Default inbound policy: {security.firewallDefaultInbound} · Stateful tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSecurity((prev) => ({
                      ...prev,
                      firewallDefaultInbound: prev.firewallDefaultInbound === 'DENY' ? 'ALLOW' : 'DENY',
                    }))
                  }
                  className="px-3 py-1.5 rounded-none bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-[#D5DCE6]"
                >
                  Inbound: {security.firewallDefaultInbound}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSecurity((prev) => ({ ...prev, firewallEnabled: !prev.firewallEnabled }))}
                  style={
                    security.firewallEnabled
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-none text-xs font-semibold ${
                    security.firewallEnabled ? '' : 'bg-white/10 text-white'
                  }`}
                >
                  {security.firewallEnabled ? 'Firewall Active' : 'Enable Firewall'}
                </button>
              </div>
            </div>

            <form
              onSubmit={handleAddRule}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3.5 rounded-none bg-[#0B0E15] border border-white/[0.09]"
            >
              <input
                type="text"
                value={newPort}
                onChange={(e) => setNewPort(e.target.value)}
                placeholder="Port (e.g. 8080)"
                className="sm:col-span-2 px-3 py-2 rounded-none bg-[#06080C] border border-white/10 text-xs font-mono text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
              />
              <select
                value={newProto}
                onChange={(e) => setNewProto(e.target.value as 'TCP' | 'UDP' | 'ANY')}
                className="sm:col-span-2 px-2.5 py-2 rounded-none bg-[#06080C] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[var(--sl8-accent)]"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ANY">ANY</option>
              </select>
              <select
                value={newDir}
                onChange={(e) => setNewDir(e.target.value as 'IN' | 'OUT')}
                className="sm:col-span-2 px-2.5 py-2 rounded-none bg-[#06080C] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[var(--sl8-accent)]"
              >
                <option value="IN">INBOUND</option>
                <option value="OUT">OUTBOUND</option>
              </select>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value as 'ALLOW' | 'DENY')}
                className="sm:col-span-2 px-2.5 py-2 rounded-none bg-[#06080C] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[var(--sl8-accent)]"
              >
                <option value="DENY">DENY</option>
                <option value="ALLOW">ALLOW</option>
              </select>
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Rule description"
                className="sm:col-span-3 px-3 py-2 rounded-none bg-[#06080C] border border-white/10 text-xs text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
              />
              <button
                type="submit"
                aria-label="Add firewall rule"
                style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                className="sm:col-span-1 py-2 px-3 rounded-none text-xs font-semibold flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="border border-white/[0.09] rounded-none overflow-hidden bg-[#0B0E15]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] text-[#7F8B9B] bg-[#090C12]">
                    <th className="py-2.5 px-4">Port / Proto</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Policy</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-4 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs">
                  {security.firewallRules.map((rule) => (
                    <tr key={rule.id} className={!rule.enabled ? 'opacity-45' : ''}>
                      <td className="py-3 px-4 font-mono tabular-nums text-white">
                        {rule.port}/{rule.protocol}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#94A0B2]">{rule.direction}</td>
                      <td className="py-3 px-3 font-mono">
                        <span style={rule.action === 'ALLOW' ? { color: 'var(--sl8-accent)' } : undefined} className="text-[#E6EAF0]">
                          {rule.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#D5DCE6]">{rule.service}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSecurity((prev) => ({
                                ...prev,
                                firewallRules: prev.firewallRules.map((r) =>
                                  r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                                ),
                              }))
                            }
                            className="px-2.5 py-1 rounded-none bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-mono text-[#E6EAF0]"
                          >
                            {rule.enabled ? 'Active' : 'Paused'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSecurity((prev) => ({
                                ...prev,
                                firewallRules: prev.firewallRules.filter((r) => r.id !== rule.id),
                              }))
                            }
                            aria-label={`Delete ${rule.service}`}
                            className="p-1 text-[#7F8B9B] hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'vpn' && (
          <div className="space-y-6">
            <div className="p-4 rounded-none bg-[#0D1119] border border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Centurion WireGuard Interface (wg0)</p>
                <p className="text-xs text-[#8E9AA9]">
                  Encrypts all outbound NetCom &amp; system traffic with kernel-space ChaCha20.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSecurity((prev) => ({ ...prev, vpnKillSwitch: !prev.vpnKillSwitch }))}
                  style={
                    security.vpnKillSwitch
                      ? {
                          borderColor: 'var(--sl8-accent-border)',
                          backgroundColor: 'var(--sl8-accent-soft)',
                          color: 'var(--sl8-accent)',
                        }
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-none text-xs font-medium border ${
                    security.vpnKillSwitch ? '' : 'border-white/10 bg-white/[0.04] text-[#94A0B2]'
                  }`}
                >
                  Kill-Switch: {security.vpnKillSwitch ? 'Armed' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSecurity((prev) => ({ ...prev, vpnEnabled: !prev.vpnEnabled }))}
                  style={
                    security.vpnEnabled
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-4 py-1.5 rounded-none text-xs font-semibold ${
                    security.vpnEnabled ? '' : 'bg-white/10 text-white'
                  }`}
                >
                  {security.vpnEnabled ? 'Connected' : 'Connect'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-2.5">
                <h2 className="font-display text-xs font-semibold text-[#94A0B2] flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
                  WireGuard Exit Nodes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VPN_EXIT_NODES.map((node) => {
                    const selected = security.vpnExitNode === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() =>
                          onUpdateSecurity((prev) => ({ ...prev, vpnExitNode: node.id, vpnEnabled: true }))
                        }
                        style={selected ? { borderColor: 'var(--sl8-accent)' } : undefined}
                        className={`p-3.5 rounded-none border text-left transition-colors ${
                          selected
                            ? 'bg-[#0F1620]'
                            : 'bg-[#0B0E15] border-white/[0.09] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{node.id}</span>
                          {selected && (
                            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                          )}
                        </div>
                        <p className="text-xs text-[#8E9AA9] mt-0.5">{node.country}</p>
                        <p className="mt-2 text-[11px] font-mono text-[#94A0B2] tabular-nums">
                          {node.ip} · {node.latency} · Load {node.load}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <h2 className="font-display text-xs font-semibold text-[#94A0B2] flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
                  DNS-over-HTTPS Resolver
                </h2>
                <div className="space-y-2">
                  {(['Quad9 DNSSEC', 'Mullvad DoH', 'Cloudflare DoH'] as const).map((provider) => {
                    const active = security.dnsProvider === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => onUpdateSecurity((prev) => ({ ...prev, dnsProvider: provider }))}
                        style={active ? { borderColor: 'var(--sl8-accent)' } : undefined}
                        className={`w-full px-3.5 py-3 rounded-none border text-left flex items-center justify-between transition-colors ${
                          active
                            ? 'bg-[#0F1620] text-white'
                            : 'bg-[#0B0E15] border-white/[0.09] text-[#94A0B2] hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-medium">{provider}</span>
                        <span
                          style={active ? { color: 'var(--sl8-accent)' } : undefined}
                          className={`text-[11px] font-mono ${active ? '' : 'text-[#6B7687]'}`}
                        >
                          {active ? 'Active' : 'Select'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { key: 'camera', title: 'Camera Interface Cut', desc: 'Unloads uvcvideo driver and blocks /dev/video* access.', icon: CameraOff },
                { key: 'microphone', title: 'Microphone Hardware Mute', desc: 'Disconnects PipeWire capture sinks and locks ALSA capture.', icon: MicOff },
                { key: 'location', title: 'Geolocation Blocked', desc: 'Disables GeoClue daemon and Wi-Fi BSSID queries.', icon: MapPinOff },
                { key: 'bluetooth', title: 'Bluetooth Radio Isolation', desc: 'Applies rfkill soft-block on Bluetooth HCI controllers.', icon: BluetoothOff },
                { key: 'telemetryBlocked', title: 'Zero-Telemetry Policy', desc: 'Strips Ubuntu popularity-contest and apport crash uploads.', icon: EyeOff },
              ] as const
            ).map((item) => {
              const enabled = security.killSwitches[item.key];
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleKillSwitch(item.key)}
                  style={enabled ? { borderColor: 'var(--sl8-accent-border)' } : undefined}
                  className={`p-4 rounded-none border text-left transition-colors flex items-start justify-between gap-4 ${
                    enabled ? 'bg-[#0F141D]' : 'bg-[#0B0E15] border-white/[0.09]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: enabled ? 'var(--sl8-accent)' : '#6B7687' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-[#8E9AA9] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <span
                    style={enabled ? { color: 'var(--sl8-accent)' } : undefined}
                    className={`text-[11px] font-mono shrink-0 ${enabled ? '' : 'text-[#6B7687]'}`}
                  >
                    {enabled ? 'LOCKED' : 'OPEN'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'kernel' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                <h2 className="font-display text-sm font-semibold text-white">
                  Linux Kernel 6.12.8-sl8-hardened Parameters
                </h2>
              </div>
              <div className="divide-y divide-white/[0.06] border border-white/[0.09] rounded-none bg-[#0B0E15] overflow-hidden">
                {(
                  [
                    { key: 'ptraceScope', param: 'kernel.yama.ptrace_scope = 2', desc: 'Restricts process memory inspection strictly to root.' },
                    { key: 'kptrRestrict', param: 'kernel.kptr_restrict = 2', desc: 'Hides exposed kernel memory pointers from user space.' },
                    { key: 'aslrFull', param: 'kernel.randomize_va_space = 2', desc: 'Enforces full ASLR across heap, stack, and mmap.' },
                    { key: 'apparmorEnforce', param: 'apparmor.mode = enforce', desc: 'Mandatory Access Control enforced on desktop binaries.' },
                    { key: 'macRandomize', param: 'net.sl8.mac_randomize = 1', desc: 'Generates ephemeral hardware MAC addresses per session.' },
                  ] as const
                ).map((item) => {
                  const active = security.kernelHardening[item.key];
                  return (
                    <div key={item.key} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-mono text-white">{item.param}</p>
                        <p className="text-xs text-[#8E9AA9] mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleKernelFlag(item.key)}
                        style={
                          active
                            ? { backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }
                            : undefined
                        }
                        className={`px-3 py-1 rounded-none text-xs font-mono shrink-0 ${
                          active ? '' : 'bg-white/[0.06] text-[#8E9AA9]'
                        }`}
                      >
                        {active ? 'ENFORCED' : 'DISABLED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                <h2 className="font-display text-sm font-semibold text-white">AppArmor &amp; Bubblewrap Sandboxes</h2>
              </div>
              <div className="border border-white/[0.09] rounded-none overflow-hidden bg-[#0B0E15]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] text-[#7F8B9B] bg-[#090C12]">
                      <th className="py-2.5 px-4">Application</th>
                      <th className="py-2.5 px-3">Profile</th>
                      <th className="py-2.5 px-3">Network Scope</th>
                      <th className="py-2.5 px-4 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {security.sandboxes.map((sb) => (
                      <tr key={sb.id}>
                        <td className="py-2.5 px-4 font-medium text-white">{sb.appName}</td>
                        <td className="py-2.5 px-3 font-mono text-[#94A0B2]">{sb.profile}</td>
                        <td className="py-2.5 px-3 text-[#D5DCE6]">{sb.networkAccess}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSecurity((prev) => ({
                                ...prev,
                                sandboxes: prev.sandboxes.map((s) =>
                                  s.id === sb.id ? { ...s, enforced: !s.enforced } : s
                                ),
                              }))
                            }
                            style={
                              sb.enforced
                                ? { backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }
                                : undefined
                            }
                            className={`px-2.5 py-1 rounded-none text-[11px] font-mono ${
                              sb.enforced ? '' : 'bg-white/[0.06] text-[#8E9AA9]'
                            }`}
                          >
                            {sb.enforced ? 'Sandboxed' : 'Unconfined'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
