import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Plus,
  X,
  Shield,
  Search,
  Flame,
  ExternalLink,
  Globe,
  Check,
  EyeOff,
  Bookmark,
} from 'lucide-react';
import { BrowserShieldSettings, BrowserTab, SecurityState } from '../../types/os';

interface NetcomAppProps {
  security: SecurityState;
  shield: BrowserShieldSettings;
  onUpdateShield: (updater: (prev: BrowserShieldSettings) => BrowserShieldSettings) => void;
  onOpenCenturion: () => void;
}

const QUICK_NAV = [
  { code: 'DDG', label: 'DuckDuckGo', url: 'netcom://search?q=DuckDuckGo+Privacy' },
  { code: 'WIKI', label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ubuntu' },
  { code: 'GIT', label: 'GitHub', url: 'netcom://search?q=GitHub+Open+Source' },
  { code: 'HN', label: 'Hacker News', url: 'netcom://ubuntu-sec' },
];

const SEARCH_ENGINES = [
  { code: 'GGL', name: 'Google' },
  { code: 'DDG', name: 'DuckDuckGo' },
  { code: 'BRV', name: 'Brave' },
] as const;

function titleForUrl(url: string): string {
  if (url === 'netcom://start') return 'NetCom';
  if (url === 'netcom://privacy-audit') return 'Privacy Audit';
  if (url === 'netcom://ubuntu-sec') return 'Ubuntu Security';
  if (url === 'netcom://docs') return 'SL8 Docs';
  if (url.startsWith('netcom://search?q=')) {
    return decodeURIComponent(url.slice('netcom://search?q='.length));
  }
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function createTab(url = 'netcom://start', isPrivate = false): BrowserTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: titleForUrl(url),
    url,
    history: [url],
    historyIndex: 0,
    isPrivate,
  };
}

function normalizeInputToUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'netcom://start';
  if (trimmed.startsWith('netcom://')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9-]+(\.[a-z]{2,})(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return `netcom://search?q=${encodeURIComponent(trimmed)}`;
}

export const NetcomApp: React.FC<NetcomAppProps> = ({
  security,
  shield,
  onUpdateShield,
  onOpenCenturion,
}) => {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [createTab('netcom://start', false)]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [addressDraft, setAddressDraft] = useState<string>('');
  const [quickSearch, setQuickSearch] = useState('');
  const [engineIdx, setEngineIdx] = useState(0);
  const [shieldOpen, setShieldOpen] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [burnNotice, setBurnNotice] = useState(false);
  const [pinnedBookmarks, setPinnedBookmarks] = useState([
    { label: 'Google', url: 'netcom://search?q=Google' },
    { label: 'Privacy Audit', url: 'netcom://privacy-audit' },
  ]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const activeEngine = SEARCH_ENGINES[engineIdx];

  const navigateTab = (targetRaw: string) => {
    const nextUrl = normalizeInputToUrl(targetRaw);
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTab.id) return tab;
        const sliced = tab.history.slice(0, tab.historyIndex + 1);
        return {
          ...tab,
          url: nextUrl,
          title: titleForUrl(nextUrl),
          history: [...sliced, nextUrl],
          historyIndex: sliced.length,
        };
      })
    );
    setAddressDraft(nextUrl === 'netcom://start' ? '' : nextUrl);
    setShieldOpen(false);
    if (shield.blockTrackers && nextUrl !== 'netcom://start') {
      const blocked = Math.floor(2 + Math.random() * 5);
      onUpdateShield((prev) => ({
        ...prev,
        trackersBlockedCount: prev.trackersBlockedCount + blocked,
        sessionBlockedCount: prev.sessionBlockedCount + blocked,
        dataSavedMb: Number((prev.dataSavedMb + blocked * 0.04).toFixed(2)),
      }));
    }
  };

  const handleSelectTab = (tab: BrowserTab) => {
    setActiveTabId(tab.id);
    setAddressDraft(tab.url === 'netcom://start' ? '' : tab.url);
    setShieldOpen(false);
  };

  const handleAddTab = (isPrivate = false) => {
    const t = createTab('netcom://start', isPrivate);
    setTabs((prev) => [...prev, t]);
    setActiveTabId(t.id);
    setAddressDraft('');
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => {
      if (prev.length === 1) {
        const fresh = createTab('netcom://start', false);
        setActiveTabId(fresh.id);
        setAddressDraft('');
        return [fresh];
      }
      const next = prev.filter((t) => t.id !== id);
      if (id === activeTabId) {
        const fallback = next[next.length - 1];
        setActiveTabId(fallback.id);
        setAddressDraft(fallback.url === 'netcom://start' ? '' : fallback.url);
      }
      return next;
    });
  };

  const toggleActiveTabIncognito = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, isPrivate: !t.isPrivate } : t))
    );
  };

  const goBack = () => {
    if (activeTab.historyIndex <= 0) return;
    const nextIdx = activeTab.historyIndex - 1;
    const url = activeTab.history[nextIdx];
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, historyIndex: nextIdx, url, title: titleForUrl(url) } : t
      )
    );
    setAddressDraft(url === 'netcom://start' ? '' : url);
  };

  const goForward = () => {
    if (activeTab.historyIndex >= activeTab.history.length - 1) return;
    const nextIdx = activeTab.historyIndex + 1;
    const url = activeTab.history[nextIdx];
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, historyIndex: nextIdx, url, title: titleForUrl(url) } : t
      )
    );
    setAddressDraft(url === 'netcom://start' ? '' : url);
  };

  const handleBurnSession = () => {
    const fresh = createTab('netcom://start', true);
    setTabs([fresh]);
    setActiveTabId(fresh.id);
    setAddressDraft('');
    setShieldOpen(false);
    onUpdateShield((prev) => ({ ...prev, sessionBlockedCount: 0 }));
    setBurnNotice(true);
    setTimeout(() => setBurnNotice(false), 2400);
  };

  const handlePinCurrent = () => {
    if (activeTab.url === 'netcom://start') return;
    if (pinnedBookmarks.some((b) => b.url === activeTab.url)) return;
    setPinnedBookmarks((prev) => [...prev, { label: activeTab.title, url: activeTab.url }]);
  };

  const shieldScore = useMemo(() => {
    return [
      shield.blockTrackers,
      shield.httpsOnly,
      shield.fingerprintProtection,
      shield.blockWebRTCLeak,
      shield.blockThirdPartyCookies,
      security.vpnEnabled,
    ].filter(Boolean).length;
  }, [shield, security.vpnEnabled]);

  const searchQuery = activeTab.url.startsWith('netcom://search?q=')
    ? decodeURIComponent(activeTab.url.slice('netcom://search?q='.length))
    : '';

  return (
    <div className="h-full flex flex-col bg-[#06090D] text-[#E6EAF0] relative">
      {/* Sharp Desktop Tab Strip */}
      <div className="px-3 pt-2 bg-[#040609] border-b border-white/[0.07] flex items-center gap-1 overflow-x-auto shrink-0">
        {tabs.map((tab) => {
          const active = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab)}
              className={`min-w-[140px] max-w-[210px] px-3 py-1.5 rounded-none text-xs flex items-center justify-between gap-2 border-t border-x transition-colors ${
                active
                  ? 'bg-[#0B1016] border-white/15 text-white'
                  : 'bg-transparent border-transparent text-[#7F8B9B] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                {tab.isPrivate ? (
                  <EyeOff className="w-3 h-3 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
                ) : (
                  <Globe
                    className="w-3 h-3 shrink-0"
                    style={{ color: active ? 'var(--sl8-accent)' : '#6B7687' }}
                  />
                )}
                <span className="truncate">{tab.title}</span>
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Close ${tab.title}`}
                onClick={(e) => handleCloseTab(tab.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCloseTab(tab.id, e as unknown as React.MouseEvent);
                }}
                className="p-0.5 rounded-none hover:bg-white/10 text-[#6B7687] hover:text-white shrink-0"
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handleAddTab(false)}
          aria-label="New tab"
          className="p-1.5 rounded-none text-[#8E9AA9] hover:text-white hover:bg-white/[0.06] shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Omnibar Row */}
      <div className="px-3.5 py-2.5 bg-[#0B1016] border-b border-white/[0.07] flex items-center gap-2.5 shrink-0 relative">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={goBack}
            disabled={activeTab.historyIndex <= 0}
            aria-label="Go back"
            className="p-1.5 rounded-none text-[#94A0B2] hover:text-white hover:bg-white/[0.06] disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            aria-label="Go forward"
            className="p-1.5 rounded-none text-[#94A0B2] hover:text-white hover:bg-white/[0.06] disabled:opacity-30"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            aria-label="Reload"
            className="p-1.5 rounded-none text-[#94A0B2] hover:text-white hover:bg-white/[0.06]"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sharp NetCom Address Pane */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTab(addressDraft);
          }}
          className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-none bg-[#0F161F] border border-white/12 focus-within:border-[var(--sl8-accent)]"
        >
          <button
            type="button"
            onClick={() => setShieldOpen((v) => !v)}
            aria-label="Toggle NetCom Shield"
            className="shrink-0"
          >
            <Shield
              className="w-4 h-4"
              fill={shield.blockTrackers ? 'var(--sl8-accent)' : 'none'}
              style={{ color: shield.blockTrackers ? 'var(--sl8-accent)' : '#94A0B2' }}
            />
          </button>
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
          <input
            type="text"
            value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#7F8B9B] focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleActiveTabIncognito}
            title={activeTab.isPrivate ? 'Incognito active on tab' : 'Switch tab to Incognito'}
            style={activeTab.isPrivate ? { color: 'var(--sl8-accent)' } : undefined}
            className="p-1 rounded-none text-[#8E9AA9] hover:text-white transition-colors"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </form>

        {/* Tab Count Square Indicator + Bookmark + Burn */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab.url !== 'netcom://start' && (
            <button
              type="button"
              onClick={handlePinCurrent}
              title="Pin bookmark"
              className="p-1.5 rounded-none text-[#94A0B2] hover:text-white hover:bg-white/[0.06]"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleAddTab(false)}
            title={`${tabs.length} open tab(s) — click to add`}
            className="w-7 h-7 rounded-none border border-white/25 text-[11px] font-mono text-white flex items-center justify-center hover:border-[var(--sl8-accent)] tabular-nums"
          >
            {tabs.length}
          </button>
          <button
            type="button"
            onClick={handleBurnSession}
            title="Burn session data"
            className="px-2.5 py-1.5 rounded-none bg-white/[0.05] hover:bg-red-500/20 text-[#B9C2CF] hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* NetCom Shield Popover */}
        {shieldOpen && (
          <div className="absolute left-28 top-14 z-30 w-80 rounded-none sl8-frosted-pane border border-white/15 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div>
                <p className="font-display text-sm font-semibold text-white">NETCOM SHIELD</p>
                <p className="text-[11px] text-[#8E9AA9]">{shieldScore} / 6 defenses active</p>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--sl8-accent)' }}>
                {shield.blockTrackers ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>

            <div className="space-y-1.5">
              {(
                [
                  { key: 'blockTrackers', label: 'Active Ad & Tracker Defense' },
                  { key: 'httpsOnly', label: 'Strict HTTPS-Only Upgrades' },
                  { key: 'fingerprintProtection', label: 'Canvas Anti-Fingerprinting' },
                  { key: 'blockWebRTCLeak', label: 'WebRTC IP Leak Guard' },
                  { key: 'blockThirdPartyCookies', label: 'Third-Party Cookie Isolation' },
                ] as const
              ).map((item) => {
                const active = shield[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onUpdateShield((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className="w-full px-2.5 py-2 rounded-none bg-white/[0.03] hover:bg-white/[0.07] flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="text-[#E6EAF0]">{item.label}</span>
                    <span
                      style={active ? { color: 'var(--sl8-accent)' } : undefined}
                      className={`font-mono text-[11px] ${active ? '' : 'text-[#6B7687]'}`}
                    >
                      {active ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-[#8E9AA9]">DNS: {security.dnsProvider}</span>
              <button
                type="button"
                onClick={() => {
                  setShieldOpen(false);
                  onOpenCenturion();
                }}
                style={{ color: 'var(--sl8-accent)' }}
                className="hover:underline"
              >
                Open Centurion
              </button>
            </div>
          </div>
        )}
      </div>

      {burnNotice && (
        <div
          style={{
            backgroundColor: 'var(--sl8-accent-soft)',
            borderColor: 'var(--sl8-accent-border)',
            color: 'var(--sl8-accent)',
          }}
          className="px-4 py-2 border-b text-xs shrink-0"
        >
          Session cleared. Opened a fresh Incognito NetCom tab.
        </div>
      )}

      {/* Main Viewport */}
      <div key={`${activeTab.id}-${reloadNonce}`} className="flex-1 min-h-0 overflow-y-auto bg-[#06090D]">
        {activeTab.url === 'netcom://start' && (
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
            {/* NetCom Hero Card with Perspective Wireframe Horizon */}
            <div className="relative rounded-none overflow-hidden border border-white/12 bg-[#05080D] p-6 min-h-[178px] flex flex-col justify-between">
              {/* Futuristic Perspective Grid SVG */}
              <svg
                aria-hidden="true"
                viewBox="0 0 800 220"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 w-full h-full opacity-70"
              >
                <defs>
                  <radialGradient id="netcomHorizon" cx="50%" cy="55%" r="50%">
                    <stop offset="0%" stopColor="var(--sl8-accent)" stopOpacity="0.34" />
                    <stop offset="65%" stopColor="var(--sl8-accent)" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#05080D" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="800" height="220" fill="url(#netcomHorizon)" />
                <line x1="0" y1="112" x2="800" y2="112" stroke="var(--sl8-accent)" strokeOpacity="0.32" strokeWidth="1" />
                {[-320, -210, -130, -70, -25, 25, 70, 130, 210, 320].map((dx) => (
                  <line
                    key={dx}
                    x1="400"
                    y1="112"
                    x2={400 + dx * 2.4}
                    y2="220"
                    stroke="var(--sl8-accent)"
                    strokeOpacity="0.22"
                    strokeWidth="1"
                  />
                ))}
                {[124, 140, 162, 190].map((y) => (
                  <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--sl8-accent)" strokeOpacity="0.16" strokeWidth="1" />
                ))}
              </svg>

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div
                  className="flex items-center gap-2 text-[11px] font-mono tracking-[0.16em]"
                  style={{ color: 'var(--sl8-accent)' }}
                >
                  <span>CHROMIUM SHIELD ENGINE</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddTab(true)}
                  style={{ borderColor: 'var(--sl8-accent-border)' }}
                  className="px-3.5 py-1.5 rounded-none border bg-[#05141C]/80 hover:bg-white/[0.08] text-xs font-medium text-[#E6F9FC] flex items-center gap-1.5 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
                  <span>Incognito</span>
                </button>
              </div>

              <div className="relative z-10 mt-6">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  NetCom
                </h1>
                <p className="text-xs sm:text-sm text-[#B4C0CE] mt-1">
                  Zero-clutter Chromium browsing with active ad &amp; tracker defense
                </p>
              </div>
            </div>

            {/* Accent-Bordered Quick Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickSearch.trim()) {
                  navigateTab(quickSearch);
                  setQuickSearch('');
                }
              }}
              style={{ borderColor: 'var(--sl8-accent-border)' }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-none bg-[#0A1118] border focus-within:border-[var(--sl8-accent)]"
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={`Quick search via ${activeEngine.name} or paste URL...`}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#7A8798] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEngineIdx((i) => (i + 1) % SEARCH_ENGINES.length)}
                title="Switch quick search engine"
                style={{ backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }}
                className="px-3 py-1 rounded-none text-[11px] font-mono font-semibold hover:opacity-90 transition-opacity shrink-0"
              >
                {activeEngine.code}
              </button>
            </form>

            {/* NETCOM SHIELD Metrics Card */}
            <div className="rounded-none bg-[#0C1118] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield
                    className="w-4 h-4"
                    fill={shield.blockTrackers ? 'var(--sl8-accent)' : 'none'}
                    style={{ color: 'var(--sl8-accent)' }}
                  />
                  <span className="font-mono text-xs tracking-[0.14em] text-[#D5DCE6]">
                    NETCOM SHIELD
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateShield((prev) => ({ ...prev, blockTrackers: !prev.blockTrackers }))
                  }
                  style={{ color: 'var(--sl8-accent)' }}
                  className="text-xs font-mono tracking-wider hover:underline"
                >
                  {shield.blockTrackers ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-none bg-[#080C12] border border-white/[0.07]">
                  <p
                    className="font-display text-xl sm:text-2xl font-semibold tabular-nums"
                    style={{ color: 'var(--sl8-accent)' }}
                  >
                    {shield.trackersBlockedCount}
                  </p>
                  <p className="text-[10px] font-mono tracking-[0.12em] text-[#7F8B9B] mt-1">
                    TOTAL BLOCKED
                  </p>
                </div>

                <div className="p-3.5 rounded-none bg-[#080C12] border border-white/[0.07]">
                  <p
                    className="font-display text-xl sm:text-2xl font-semibold tabular-nums"
                    style={{ color: 'var(--sl8-accent)' }}
                  >
                    {shield.sessionBlockedCount}
                  </p>
                  <p className="text-[10px] font-mono tracking-[0.12em] text-[#7F8B9B] mt-1">
                    SESSION
                  </p>
                </div>

                <div className="p-3.5 rounded-none bg-[#080C12] border border-white/[0.07]">
                  <p
                    className="font-display text-xl sm:text-2xl font-semibold tabular-nums"
                    style={{ color: 'var(--sl8-accent)' }}
                  >
                    {shield.dataSavedMb.toFixed(1)} MB
                  </p>
                  <p className="text-[10px] font-mono tracking-[0.12em] text-[#7F8B9B] mt-1">
                    DATA SAVED
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Split: PINNED BOOKMARKS & QUICK NAVIGATION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-5 space-y-2.5">
                <p className="text-[11px] font-mono tracking-[0.16em]" style={{ color: 'var(--sl8-accent)' }}>
                  PINNED BOOKMARKS
                </p>
                <div className="space-y-2">
                  {pinnedBookmarks.map((bm) => (
                    <button
                      key={bm.url}
                      type="button"
                      onClick={() => navigateTab(bm.url)}
                      className="w-full p-3.5 rounded-none bg-[#0C1118] hover:bg-[#111923] border border-white/10 flex items-center gap-3 text-left transition-colors"
                    >
                      <span
                        className="w-9 h-9 rounded-none flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'var(--sl8-accent-soft)' }}
                      >
                        <Bookmark className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} fill="var(--sl8-accent)" />
                      </span>
                      <span className="text-sm font-medium text-white truncate">{bm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 space-y-2.5">
                <p className="text-[11px] font-mono tracking-[0.16em] text-[#94A0B2]">
                  QUICK NAVIGATION
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {QUICK_NAV.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => navigateTab(item.url)}
                      className="p-3.5 rounded-none bg-[#0C1118] hover:bg-[#111923] border border-white/10 flex items-center gap-3 text-left transition-colors"
                    >
                      <span
                        className="w-10 h-10 rounded-none text-[11px] font-mono font-semibold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }}
                      >
                        {item.code}
                      </span>
                      <span className="text-sm font-medium text-white truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab.url === 'netcom://privacy-audit' && (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-white">
                NetCom Live Privacy &amp; Fingerprint Audit
              </h1>
              <p className="text-xs text-[#8E9AA9] mt-1">
                Verified in real time against your NetCom Shield and SL8 Ubuntu Security settings.
              </p>
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl bg-[#0C1118] overflow-hidden text-xs">
              {[
                ['Active Ad & Tracker Defense', shield.blockTrackers, `${shield.trackersBlockedCount} blocked (${shield.dataSavedMb.toFixed(1)} MB saved)`],
                ['HTTPS-Only Transport Upgrade', shield.httpsOnly, 'Plaintext HTTP blocked automatically'],
                ['Canvas / WebGL Anti-Fingerprinting', shield.fingerprintProtection, 'Randomized readout noise enabled'],
                ['WebRTC Local IP Leak Protection', shield.blockWebRTCLeak, 'Local interface enumeration suppressed'],
                ['Third-Party Cookie Isolation', shield.blockThirdPartyCookies, 'Strict per-origin partitioning'],
                ['WireGuard Tunnel Encapsulation', security.vpnEnabled, security.vpnEnabled ? security.vpnExitNode : 'Disabled in OS Security'],
                ['Hardware MAC Randomization', security.kernelHardening.macRandomize, 'Fresh ephemeral MAC on association'],
              ].map(([label, ok, note]) => (
                <div key={String(label)} className="px-4 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-[#8E9AA9] mt-0.5">{note}</p>
                  </div>
                  <span className={`font-mono flex items-center gap-1 ${ok ? 'text-[#00D8F5]' : 'text-amber-400'}`}>
                    {ok && <Check className="w-3.5 h-3.5" />}
                    {ok ? 'PROTECTED' : 'EXPOSED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab.url === 'netcom://ubuntu-sec' && (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
            <div>
              <h1 className="font-display text-2xl font-semibold text-white">
                Ubuntu 26.04 LTS &amp; SL8 Security Advisories
              </h1>
              <p className="text-xs text-[#8E9AA9] mt-1">
                Signed upstream Ubuntu security notices verified for SL8 Desktop OS.
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: 'USN-7412-1',
                  title: 'Linux Kernel 6.12.8-sl8-hardened Netfilter & Memory Isolation Update',
                  status: 'Patched on this host',
                  date: '2026-11-18',
                },
                {
                  id: 'USN-7408-1',
                  title: 'OpenSSL 3.4 TLS 1.3 Cipher Hardening & Certificate Validation',
                  status: 'Patched on this host',
                  date: '2026-11-15',
                },
                {
                  id: 'USN-7401-2',
                  title: 'AppArmor 4.1 User Namespace Confinement Rules for Wayland Clients',
                  status: 'Enforcing (24 profiles)',
                  date: '2026-11-11',
                },
              ].map((adv) => (
                <div key={adv.id} className="p-4 rounded-xl bg-[#0C1118] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#00D8F5]">{adv.id}</span>
                    <span className="text-[#7F8B9B]">{adv.date}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{adv.title}</p>
                  <p className="text-xs text-[#94A0B2]">{adv.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab.url.startsWith('netcom://search?q=') && (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <p className="text-xs font-mono text-[#00D8F5]">
                  NetCom Shield Search · {activeEngine.name}
                </p>
                <h1 className="font-display text-xl font-semibold text-white mt-0.5">
                  Results for &ldquo;{searchQuery}&rdquo;
                </h1>
              </div>
              <span className="text-xs text-[#7F8B9B]">Zero telemetry logged</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: `${searchQuery} — Wikipedia Encyclopedia`,
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchQuery.replace(/\s+/g, '_'))}`,
                  snippet: `Open the encrypted HTTPS Wikipedia article for ${searchQuery} inside NetCom.`,
                },
                {
                  title: 'NetCom Live Privacy & Fingerprint Audit',
                  url: 'netcom://privacy-audit',
                  snippet: 'Verify active tracker blocking, HTTPS-Only enforcement, WebRTC leak guards, and WireGuard routing.',
                },
                {
                  title: 'Ubuntu 26.04 LTS & SL8 Security Advisories',
                  url: 'netcom://ubuntu-sec',
                  snippet: 'Review signed kernel and AppArmor updates running on SL8 Desktop OS.',
                },
              ].map((res) => (
                <button
                  key={res.url}
                  type="button"
                  onClick={() => navigateTab(res.url)}
                  className="w-full p-4 rounded-xl bg-[#0C1118] hover:bg-[#111923] border border-white/[0.08] text-left space-y-1 transition-colors"
                >
                  <p className="text-xs font-mono text-[#00D8F5] truncate">{res.url}</p>
                  <p className="font-display text-sm font-semibold text-white">{res.title}</p>
                  <p className="text-xs text-[#8E9AA9]">{res.snippet}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab.url.startsWith('http') && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 bg-[#0C1018] border-b border-white/[0.06] flex items-center justify-between gap-3 text-[11px] text-[#94A0B2] shrink-0">
              <span>NetCom Chromium Shield frame · External sites with X-Frame-Options may require opening in a host tab.</span>
              <a
                href={activeTab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D8F5] hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                Open Externally <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              title={activeTab.title}
              src={activeTab.url}
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
              className="flex-1 w-full bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};
