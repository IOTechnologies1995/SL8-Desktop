import React, { useMemo, useState } from 'react';
import { Search, Download, Trash2, Check, Package } from 'lucide-react';
import { UbuntuPackage } from '../../types/os';

interface PackagesAppProps {
  packages: UbuntuPackage[];
  onToggleInstall: (id: string) => void;
}

type CategoryFilter = 'All' | 'Privacy & Network' | 'Security & Crypto' | 'Developer' | 'Installed';

export const PackagesApp: React.FC<PackagesAppProps> = ({ packages, onToggleInstall }) => {
  const [filter, setFilter] = useState<CategoryFilter>('All');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((pkg) => {
      if (filter === 'Installed' && !pkg.installed) return false;
      if (filter !== 'All' && filter !== 'Installed' && pkg.category !== filter) return false;
      if (!q) return true;
      return (
        pkg.displayName.toLowerCase().includes(q) ||
        pkg.pkgName.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q)
      );
    });
  }, [packages, filter, query]);

  const handleAction = (id: string) => {
    setBusyId(id);
    setTimeout(() => {
      onToggleInstall(id);
      setBusyId(null);
    }, 360);
  };

  return (
    <div className="h-full flex flex-col bg-[#080A0F] text-[#E6EAF0]">
      <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0B0E15] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="font-display text-base font-semibold text-white">Ubuntu Software &amp; APT</h1>
          <p className="text-xs text-[#8E9AA9]">
            Verified GPG-signed repositories · Ubuntu 26.04 Hardened &amp; Sandboxed Flatpak
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#6B7687] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search APT packages..."
            className="w-56 pl-8 pr-3 py-1.5 rounded-none bg-[#06080C] border border-white/10 text-xs text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="px-5 py-2.5 border-b border-white/[0.06] bg-[#090C12] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {(['All', 'Privacy & Network', 'Security & Crypto', 'Developer', 'Installed'] as const).map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              style={
                filter === cat
                  ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
                  : undefined
              }
              className={`px-3 py-1.5 rounded-none text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                filter === cat ? '' : 'text-[#94A0B2] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Package Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7F8B9B]">
            No Ubuntu packages match your current filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((pkg) => {
              const isBusy = busyId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className="p-4 rounded-none bg-[#0B0E15] border border-white/[0.09] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-none bg-[#121722] border border-white/[0.09] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                        </div>
                        <div>
                          <p className="font-display text-sm font-semibold text-white">{pkg.displayName}</p>
                          <p className="text-[11px] font-mono text-[#7F8B9B]">
                            {pkg.pkgName} · v{pkg.version}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#8E9AA9] tabular-nums shrink-0">
                        {pkg.size}
                      </span>
                    </div>

                    <p className="text-xs text-[#A5B0C0] leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#7F8B9B]">{pkg.source}</span>
                    {pkg.installed ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-mono flex items-center gap-1"
                          style={{ color: 'var(--sl8-accent)' }}
                        >
                          <Check className="w-3.5 h-3.5" /> Installed
                        </span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAction(pkg.id)}
                          className="px-2.5 py-1 rounded-none bg-white/[0.05] hover:bg-red-500/20 text-[11px] text-[#B9C2CF] hover:text-red-300 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {isBusy ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(pkg.id)}
                        style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                        className="px-3.5 py-1.5 rounded-none text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {isBusy ? 'Installing...' : 'Install'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
