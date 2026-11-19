import React, { useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { DesktopNote } from '../../types/os';

interface NotesAppProps {
  notes: DesktopNote[];
  onCreateNote: () => DesktopNote;
  onUpdateNote: (id: string, patch: Partial<DesktopNote>) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesApp: React.FC<NotesAppProps> = ({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedId, setSelectedId] = useState<string>(notes[0]?.id ?? '');
  const activeNote = notes.find((n) => n.id === selectedId) ?? notes[0] ?? null;

  const handleNew = () => {
    const created = onCreateNote();
    setSelectedId(created.id);
  };

  const wordCount = activeNote
    ? activeNote.body
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  return (
    <div className="h-full flex bg-[#080A0F] text-[#E6EAF0]">
      <aside className="w-56 shrink-0 border-r border-white/[0.08] bg-[#0B0E15] flex flex-col">
        <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.14em] text-[#8E9AA9]">SL8 NOTES</span>
          <button
            type="button"
            onClick={handleNew}
            style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
            className="px-2.5 py-1 rounded-none text-[11px] font-semibold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
          {notes.map((n) => {
            const selected = activeNote?.id === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelectedId(n.id)}
                style={selected ? { borderColor: 'var(--sl8-accent)' } : undefined}
                className={`w-full px-3.5 py-3 text-left border-l-2 transition-colors ${
                  selected
                    ? 'bg-[#131924] text-white'
                    : 'border-transparent text-[#94A0B2] hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <p className="text-xs font-medium truncate">{n.title || 'Untitled Note'}</p>
                <p className="text-[10px] font-mono text-[#6B7687] mt-1">{n.updatedAt}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {activeNote ? (
          <>
            <header className="px-5 py-3 border-b border-white/[0.08] bg-[#0A0D14] flex items-center justify-between gap-3 shrink-0">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) =>
                  onUpdateNote(activeNote.id, {
                    title: e.target.value,
                    updatedAt: `Edited ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                  })
                }
                placeholder="Note title..."
                className="flex-1 bg-transparent font-display text-base font-semibold text-white placeholder-[#6B7687] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(activeNote.id);
                  const next = notes.find((n) => n.id !== activeNote.id);
                  setSelectedId(next?.id ?? '');
                }}
                aria-label="Delete note"
                className="p-1.5 text-[#7F8B9B] hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </header>

            <textarea
              value={activeNote.body}
              onChange={(e) =>
                onUpdateNote(activeNote.id, {
                  body: e.target.value,
                  updatedAt: `Edited ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                })
              }
              placeholder="Write private local notes..."
              className="flex-1 w-full p-5 bg-[#07090D] text-sm text-[#DDE4EE] leading-relaxed font-sans focus:outline-none resize-none"
            />

            <footer className="px-5 py-2 border-t border-white/[0.07] bg-[#0A0D14] flex items-center justify-between text-[11px] font-mono text-[#7F8B9B] tabular-nums shrink-0">
              <span>Stored locally in SL8 encrypted workspace</span>
              <span>
                {wordCount} words · {activeNote.body.length} chars
              </span>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#7F8B9B]">
            <FileText className="w-7 h-7 opacity-60" />
            <p className="text-xs">No notes yet. Click &ldquo;New&rdquo; to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
