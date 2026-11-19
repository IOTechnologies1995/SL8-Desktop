import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarEvent } from '../../types/os';

interface CalendarAppProps {
  events: CalendarEvent[];
  onAddEvent: (ev: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const CalendarApp: React.FC<CalendarAppProps> = ({
  events,
  onAddEvent,
  onDeleteEvent,
}) => {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(() =>
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [category, setCategory] = useState<CalendarEvent['category']>('System');

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = useMemo(() => {
    const arr: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      arr.push({ day: null, key: `blank-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: d, key: toDateKey(viewYear, viewMonth, d) });
    }
    return arr;
  }, [firstDayOfMonth, daysInMonth, viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dayEvents = events.filter((e) => e.dateKey === selectedKey);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      id: `ev-${Date.now()}`,
      dateKey: selectedKey,
      title: title.trim(),
      time: time || '09:00',
      category,
    });
    setTitle('');
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#080A0F] text-[#E6EAF0]">
      {/* Left Month Grid */}
      <div className="flex-1 min-w-0 flex flex-col border-b md:border-b-0 md:border-r border-white/[0.08]">
        <header className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0B0F16] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
            <h1 className="font-display text-base font-semibold text-white">{monthLabel}</h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                setSelectedKey(todayKey);
              }}
              className="px-2.5 py-1 rounded-none border border-white/12 text-[11px] font-mono text-[#B9C2CF] hover:text-white hover:bg-white/[0.06]"
            >
              TODAY
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-none border border-white/12 text-[#B9C2CF] hover:text-white hover:bg-white/[0.06]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-none border border-white/12 text-[#B9C2CF] hover:text-white hover:bg-white/[0.06]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 border-b border-white/[0.07] bg-[#0A0D13] shrink-0">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-[10px] font-mono tracking-wider text-[#7F8B9B]">
              {wd}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#07090D]">
          {cells.map((cell) => {
            if (cell.day === null) {
              return <div key={cell.key} className="border-r border-b border-white/[0.05] bg-[#06070A]" />;
            }
            const isSelected = cell.key === selectedKey;
            const isToday = cell.key === todayKey;
            const count = events.filter((e) => e.dateKey === cell.key).length;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedKey(cell.key)}
                style={
                  isSelected
                    ? { backgroundColor: 'var(--sl8-accent-soft)', borderColor: 'var(--sl8-accent)' }
                    : undefined
                }
                className={`p-2 border-r border-b border-white/[0.06] text-left flex flex-col justify-between transition-colors ${
                  isSelected ? 'border' : 'hover:bg-white/[0.04]'
                }`}
              >
                <span
                  style={isToday ? { color: 'var(--sl8-accent)' } : undefined}
                  className={`text-xs font-mono tabular-nums ${
                    isToday ? 'font-bold' : isSelected ? 'text-white' : 'text-[#C5CFDD]'
                  }`}
                >
                  {cell.day}
                </span>

                {count > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="h-1 flex-1" style={{ backgroundColor: 'var(--sl8-accent)' }} />
                    <span className="text-[9px] font-mono text-[#94A0B2] tabular-nums">{count}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Event Agenda & Creator */}
      <aside className="w-full md:w-72 shrink-0 bg-[#0B0E15] flex flex-col">
        <div className="px-4 py-3.5 border-b border-white/[0.08]">
          <p className="text-[10px] font-mono tracking-[0.14em]" style={{ color: 'var(--sl8-accent)' }}>
            SELECTED DATE
          </p>
          <p className="font-display text-base font-semibold text-white mt-0.5 tabular-nums">
            {selectedKey}
          </p>
        </div>

        <form onSubmit={handleAdd} className="p-4 border-b border-white/[0.08] space-y-2.5 bg-[#090C12]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add event title..."
            className="w-full px-3 py-2 rounded-none bg-[#06080C] border border-white/12 text-xs text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-2.5 py-1.5 rounded-none bg-[#06080C] border border-white/12 text-xs font-mono text-white focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CalendarEvent['category'])}
              className="px-2.5 py-1.5 rounded-none bg-[#06080C] border border-white/12 text-xs font-mono text-white focus:outline-none"
            >
              <option value="System">System</option>
              <option value="Security">Security</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <button
            type="submit"
            style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
            className="w-full py-2 rounded-none text-xs font-display font-semibold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add to Schedule
          </button>
        </form>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06]">
          {dayEvents.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#7F8B9B]">No events scheduled for this date.</div>
          ) : (
            dayEvents.map((ev) => (
              <div key={ev.id} className="px-4 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{ev.title}</p>
                  <p className="text-[11px] font-mono text-[#8E9AA9] mt-0.5 tabular-nums">
                    {ev.time} · {ev.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(ev.id)}
                  aria-label={`Delete ${ev.title}`}
                  className="p-1 text-[#7F8B9B] hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
