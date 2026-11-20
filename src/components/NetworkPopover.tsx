import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Cable, Lock } from 'lucide-react';

type Result = { ok: boolean; output?: string; error?: string };
type Bridge = { network: (action: string, payload?: Record<string, unknown>) => Promise<Result> };
type Device = { name: string; type: string; state: string; connection: string; ip: string; gateway: string; dns: string[]; uuid?: string };
type AccessPoint = { ssid: string; signal: number; security: string; frequency: string; active: boolean };
const bridge = (): Bridge | undefined => (window as Window & { sl8System?: Bridge }).sl8System;
const parse = (line: string) => line.split(/(?<!\\):/).map(v => v.replace(/\\:/g, ':').replace(/\\\\/g, '\\'));
const button = 'px-2.5 py-1.5 border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs disabled:opacity-40';

export function NetworkPopover({ onStatus }: { onStatus: (label: string, connected: boolean) => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmDevice, setConfirmDevice] = useState<string | null>(null);

  const refresh = useCallback(async (scan = false) => {
    const api = bridge();
    if (!api) { setError('Native network management is available only in the installed SL8 desktop.'); return; }
    const [dev, conn, radio] = await Promise.all([
      api.network('devices'), api.network('connections'), api.network('wifi-status')
    ]);
    if (!dev.ok) { setError(dev.error || 'Unable to read network devices'); return; }
    const saved = new Map<string, string>();
    if (conn.ok) for (const line of (conn.output || '').split('\n')) {
      const [uuid, , , device] = parse(line);
      if (device && uuid) saved.set(device, uuid);
    }
    const list: Device[] = [];
    for (const line of (dev.output || '').split('\n')) {
      const [name, type, state, connection] = parse(line);
      if (!name || type === 'loopback') continue;
      list.push({ name, type, state, connection, ip: '', gateway: '', dns: [], uuid: saved.get(name) });
    }
    const withDetails = await Promise.all(list.map(async d => {
      const result = await api.network('details', { device: d.name });
      if (result.ok) for (const line of (result.output || '').split('\n')) {
        const pos = line.indexOf(':');
        if (pos < 0) continue;
        const key = line.slice(0, pos);
        const value = line.slice(pos + 1);
        if (key.startsWith('IP4.ADDRESS')) d.ip = value;
        if (key.startsWith('IP4.GATEWAY')) d.gateway = value;
        if (key.startsWith('IP4.DNS')) d.dns.push(value);
      }
      return d;
    }));
    setDevices(withDetails);
    setHasWifi(withDetails.some(d => d.type === 'wifi'));
    setWifiEnabled((radio.output || '').trim().endsWith('enabled'));
    const connected = withDetails.find(d => d.state === 'connected' || d.state.startsWith('connected '));
    onStatus(connected?.connection || '', !!connected);
    if (scan && withDetails.some(d => d.type === 'wifi')) {
      const ap = await api.network('wifi-list');
      if (ap.ok) {
        const unique = new Map<string, AccessPoint>();
        for (const line of (ap.output || '').split('\n')) {
          const [inUse, ssid, signal, security, frequency] = parse(line);
          if (!ssid) continue;
          const entry = { ssid, signal: Number(signal) || 0, security: security || '', frequency: frequency || '', active: inUse === '*' };
          if (!unique.has(ssid) || entry.signal > unique.get(ssid)!.signal) unique.set(ssid, entry);
        }
        setAccessPoints([...unique.values()].sort((a,b) => b.signal - a.signal));
      } else setError(ap.error || 'Wi-Fi scan failed');
    }
  }, [onStatus]);

  useEffect(() => { void refresh(true); const timer = window.setInterval(() => void refresh(false), 8000); return () => window.clearInterval(timer); }, [refresh]);

  const act = async (action: string, payload: Record<string, unknown> = {}) => {
    const api = bridge(); if (!api) return;
    setBusy(true); setError('');
    try {
      const result = await api.network(action, payload);
      if (!result.ok) setError(result.error || 'Network operation failed');
      else { setPasswordFor(null); setPassword(''); setConfirmDevice(null); }
      await refresh(true);
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  };

  return <div className="absolute right-0 top-[40px] w-96 max-h-[75vh] overflow-y-auto rounded-none sl8-frosted-pane border border-white/15 p-4 space-y-3 text-white">
    <div className="flex justify-between items-center border-b border-white/10 pb-3">
      <strong className="text-sm">NETWORK MANAGER</strong>
      <button className={button} disabled={busy} onClick={() => void refresh(true)}><RefreshCw className="w-3.5 h-3.5 inline mr-1"/>Refresh</button>
    </div>
    {error && <p role="alert" className="text-xs text-red-300 break-words">{error}</p>}
    <div className="space-y-2">
      <p className="text-[11px] font-mono text-[#8E9AA9]">NETWORK ADAPTERS</p>
      {!devices.length && <p className="text-xs text-[#8E9AA9]">No network adapters detected.</p>}
      {devices.map(d => <div key={d.name} className="border border-white/10 bg-white/[0.04] p-3 space-y-2">
        <div className="flex gap-2 items-center">{d.type === 'wifi' ? <Wifi className="w-4 h-4"/> : <Cable className="w-4 h-4"/>}<span className="text-xs font-semibold truncate">{d.connection && d.connection !== '--' ? d.connection : d.name}</span></div>
        <p className="text-[11px] text-[#A9B5C4] font-mono">{d.name} · {d.type} · {d.state}</p>
        {d.ip && <p className="text-[11px] text-[#A9B5C4] font-mono">IP: {d.ip}</p>}
        {d.gateway && <p className="text-[11px] text-[#A9B5C4] font-mono">Gateway: {d.gateway}</p>}
        {!!d.dns.length && <p className="text-[11px] text-[#A9B5C4] font-mono">DNS: {d.dns.join(', ')}</p>}
        {d.state === 'connected' ? confirmDevice === d.name
          ? <div className="space-y-2"><p className="text-xs text-amber-200">Disconnect {d.name}? Internet access may be interrupted.</p><button disabled={busy} className={button} onClick={() => void act('disconnect', { device: d.name })}>Confirm disconnect</button><button className={button} onClick={() => setConfirmDevice(null)}>Cancel</button></div>
          : <button disabled={busy} className={button} onClick={() => setConfirmDevice(d.name)}>Disconnect</button>
          : d.uuid && <button disabled={busy} className={button} onClick={() => void act('connect-saved', { uuid: d.uuid })}>Reconnect</button>}
      </div>)}
    </div>
    <div className="border-t border-white/10 pt-3 space-y-2">
      <div className="flex justify-between items-center"><span className="text-xs font-semibold">Wi-Fi</span><button disabled={busy || !hasWifi} className={button} onClick={() => void act('wifi-radio', { enabled: !wifiEnabled })}>{!hasWifi ? 'NO ADAPTER' : wifiEnabled ? 'ON' : 'OFF'}</button></div>
      {!hasWifi && <p className="text-xs text-[#8E9AA9]">No Wi-Fi adapter detected. VirtualBox currently provides Ethernet.</p>}
      {hasWifi && wifiEnabled && <div className="space-y-1 max-h-52 overflow-y-auto">{accessPoints.length === 0 && <p className="text-xs text-[#8E9AA9]">No Wi-Fi networks found.</p>}{accessPoints.map(ap => <div key={ap.ssid} className="border border-white/10 p-2 space-y-2">
        <button disabled={busy || ap.active} className="w-full flex justify-between text-xs text-left" onClick={() => ap.security && ap.security !== '--' ? (setPasswordFor(ap.ssid), setPassword('')) : void act('wifi-connect', { ssid: ap.ssid })}><span className="truncate">{ap.ssid} {ap.security && ap.security !== '--' && <Lock className="w-3 h-3 inline"/>}</span><span className="text-[#A9B5C4] ml-2">{ap.active ? 'CONNECTED' : ap.signal + '%'}</span></button>
        {passwordFor === ap.ssid && <form className="flex gap-1" onSubmit={e => { e.preventDefault(); void act('wifi-connect', { ssid: ap.ssid, password }); }}><input type="password" autoComplete="off" aria-label="Wi-Fi password" className="min-w-0 flex-1 bg-black/40 border border-white/20 text-xs px-2" value={password} onChange={e => setPassword(e.target.value)}/><button disabled={busy || !password} className={button}>Join</button></form>}
      </div>)}</div>}
    </div>
  </div>;
}
