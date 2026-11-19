import React, { useMemo, useState } from 'react';
import {
  Folder,
  FileText,
  Lock,
  Unlock,
  Plus,
  FolderPlus,
  Trash2,
  Play,
  Search,
  ChevronRight,
  Save,
} from 'lucide-react';
import { VirtualFile } from '../../types/os';

interface FilesAppProps {
  files: VirtualFile[];
  initialSelectedPath?: string | null;
  onCreateFile: (parentPath: string, name: string, type: 'file' | 'folder', content?: string) => void;
  onUpdateFile: (path: string, patch: Partial<VirtualFile>) => void;
  onDeleteFile: (path: string) => void;
  onOpenZHD2: () => void;
}

const BOOKMARKS = [
  { label: 'Home', path: '/home/sl8' },
  { label: 'Documents', path: '/home/sl8/Documents' },
  { label: 'Media', path: '/home/sl8/Media' },
  { label: 'Vault', path: '/home/sl8/Vault' },
  { label: 'Config (/etc/sl8)', path: '/etc/sl8' },
  { label: 'Centurion Logs', path: '/var/log/centurion' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const FilesApp: React.FC<FilesAppProps> = ({
  files,
  initialSelectedPath,
  onCreateFile,
  onUpdateFile,
  onDeleteFile,
  onOpenZHD2,
}) => {
  const initialFile = initialSelectedPath ? files.find((f) => f.path === initialSelectedPath) : null;
  const [currentDir, setCurrentDir] = useState(initialFile ? initialFile.parentPath : '/home/sl8/Documents');
  const [selectedPath, setSelectedPath] = useState<string | null>(
    initialFile ? initialFile.path : '/home/sl8/Documents/README-SL8.md'
  );
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');
  const [editDraft, setEditDraft] = useState<string | null>(null);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? files.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
      : files.filter((f) => f.parentPath === currentDir);
    return [...list].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [files, currentDir, search]);

  const selectedFile = files.find((f) => f.path === selectedPath) ?? null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creating || !newName.trim()) return;
    onCreateFile(currentDir, newName.trim(), creating, creating === 'file' ? '' : undefined);
    setNewName('');
    setCreating(null);
  };

  const handleSelect = (item: VirtualFile) => {
    if (item.type === 'folder') {
      setCurrentDir(item.path);
      setSelectedPath(null);
      setEditDraft(null);
      setSearch('');
    } else {
      setSelectedPath(item.path);
      setEditDraft(null);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedFile || editDraft === null) return;
    onUpdateFile(selectedFile.path, {
      content: editDraft,
      sizeBytes: new Blob([editDraft]).size,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    setEditDraft(null);
  };

  const breadcrumbs = currentDir.split('/').filter(Boolean);

  return (
    <div className="h-full flex bg-[#080A0F] text-[#E6EAF0]">
      <aside className="w-48 shrink-0 border-r border-white/[0.08] bg-[#0B0E15] p-3 flex flex-col justify-between">
        <div className="space-y-1">
          <p className="px-2.5 pb-2 text-[11px] font-mono tracking-wider text-[#7F8B9B]">LOCATIONS</p>
          {BOOKMARKS.map((bm) => {
            const active = currentDir === bm.path && !search;
            return (
              <button
                key={bm.path}
                type="button"
                onClick={() => {
                  setCurrentDir(bm.path);
                  setSearch('');
                }}
                style={
                  active
                    ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)', borderColor: 'var(--sl8-accent)' }
                    : undefined
                }
                className={`w-full px-2.5 py-2 rounded-none border-l-2 text-left text-xs font-medium transition-colors flex items-center gap-2 ${
                  active ? '' : 'border-transparent text-[#94A0B2] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{bm.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2.5 rounded-none bg-[#07090E] border border-white/[0.07] text-[11px] text-[#7F8B9B]">
          <p className="text-white font-medium">LUKS2 Volume</p>
          <p className="font-mono mt-0.5">AES-XTS-512 Active</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col border-r border-white/[0.08]">
        <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0B0E15] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs font-mono text-[#94A0B2] min-w-0 overflow-hidden">
            {breadcrumbs.map((part, idx) => {
              const targetPath = '/' + breadcrumbs.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={targetPath}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-[#6B7687] shrink-0" />}
                  <button
                    type="button"
                    onClick={() => setCurrentDir(targetPath)}
                    className="hover:text-white truncate"
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7687] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter files..."
                className="w-36 pl-8 pr-2.5 py-1.5 rounded-none bg-[#06080C] border border-white/10 text-xs text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setCreating('file')}
              title="New file"
              className="p-1.5 rounded-none bg-white/[0.05] hover:bg-white/[0.1] text-[#D5DCE6] hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCreating('folder')}
              title="New folder"
              className="p-1.5 rounded-none bg-white/[0.05] hover:bg-white/[0.1] text-[#D5DCE6] hover:text-white transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {creating && (
          <form
            onSubmit={handleCreate}
            className="px-4 py-2.5 border-b border-white/[0.08] bg-[#0D131C] flex items-center gap-2"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={creating === 'folder' ? 'Folder name...' : 'File name (e.g. notes.txt)...'}
              autoFocus
              className="flex-1 px-2.5 py-1.5 rounded bg-[#07090D] border border-white/12 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
            />
            <button type="submit" className="px-3 py-1.5 rounded bg-[#00E5FF] text-[#05080C] text-xs font-semibold">
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(null)}
              className="px-2.5 py-1.5 rounded bg-white/[0.06] text-xs text-[#94A0B2]"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
          {visibleItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7F8B9B]">Directory is empty.</div>
          ) : (
            visibleItems.map((item) => {
              const isSelected = selectedPath === item.path;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-[#121923]' : 'hover:bg-white/[0.025]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-[#00E5FF] shrink-0" />
                    ) : item.encrypted ? (
                      <Lock className="w-4 h-4 text-[#00E5FF] shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#94A0B2] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-[11px] font-mono text-[#6B7687] tabular-nums">
                        {item.permissions} · {item.updatedAt}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#8E9AA9] tabular-nums shrink-0">
                    {item.type === 'folder' ? 'DIR' : formatSize(item.sizeBytes)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="w-72 lg:w-80 shrink-0 bg-[#0B0E14] flex flex-col">
        {selectedFile ? (
          <>
            <div className="p-4 border-b border-white/[0.08] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[11px] font-mono text-[#7F8B9B] truncate mt-0.5">{selectedFile.path}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteFile(selectedFile.path);
                    setSelectedPath(null);
                  }}
                  aria-label={`Delete ${selectedFile.name}`}
                  className="p-1.5 rounded text-[#7F8B9B] hover:text-red-400 hover:bg-white/[0.05]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateFile(selectedFile.path, { encrypted: !selectedFile.encrypted });
                    setEditDraft(null);
                  }}
                  style={
                    selectedFile.encrypted
                      ? { backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }
                      : undefined
                  }
                  className={`flex-1 py-1.5 px-2.5 rounded-none text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    selectedFile.encrypted ? '' : 'bg-white/[0.06] hover:bg-white/[0.11] text-white'
                  }`}
                >
                  {selectedFile.encrypted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {selectedFile.encrypted ? 'Unlock AES' : 'Vault Lock'}
                </button>
                {(selectedFile.path.includes('/Media/') || selectedFile.name.endsWith('.m3u')) && (
                  <button
                    type="button"
                    onClick={onOpenZHD2}
                    style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                    className="flex-1 py-1.5 px-2.5 rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                  >
                    <Play className="w-3.5 h-3.5" />
                    ZHD2
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 p-4 flex flex-col">
              {selectedFile.encrypted ? (
                <div
                  style={{ borderColor: 'var(--sl8-accent-border)' }}
                  className="flex-1 rounded-none border bg-[#080C12] p-5 flex flex-col items-center justify-center text-center space-y-2"
                >
                  <Lock className="w-6 h-6" style={{ color: 'var(--sl8-accent)' }} />
                  <p className="font-display text-sm font-semibold text-white">AES-256 Vault Locked</p>
                  <p className="text-xs text-[#8E9AA9]">
                    Click &ldquo;Unlock AES&rdquo; above to inspect or edit plaintext contents.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-[#8E9AA9]">File Contents</span>
                    {editDraft !== null ? (
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        style={{ color: 'var(--sl8-accent)' }}
                        className="text-xs font-medium flex items-center gap-1 hover:underline"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditDraft(selectedFile.content || '')}
                        className="text-xs text-[#94A0B2] hover:text-white"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editDraft !== null ? (
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      style={{ borderColor: 'var(--sl8-accent-border)' }}
                      className="flex-1 w-full p-3 rounded-none bg-[#06080C] border font-mono text-[11px] text-white leading-relaxed focus:outline-none resize-none"
                    />
                  ) : (
                    <pre className="flex-1 p-3 rounded-none bg-[#06080C] border border-white/[0.06] font-mono text-[11px] text-[#C7D1DF] leading-relaxed overflow-auto whitespace-pre-wrap break-words">
                      {selectedFile.content || '(Empty file)'}
                    </pre>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-[#7F8B9B]">
            Select a file to inspect metadata, edit contents, or lock with AES-256.
          </div>
        )}
      </div>
    </div>
  );
};
