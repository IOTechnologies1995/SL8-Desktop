import React, { useCallback, useEffect, useState } from 'react';
import { Delete, History } from 'lucide-react';

interface CalcHistoryEntry {
  expr: string;
  result: string;
}

function safeEvaluate(expression: string): string {
  const sanitized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, String(Math.PI))
    .replace(/\be\b/g, String(Math.E))
    .replace(/[^0-9+\-*/().%\s]/g, '');

  if (!sanitized.trim()) return '0';
  try {
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const val = fn();
    if (typeof val !== 'number' || !Number.isFinite(val)) return 'Error';
    return String(Number(val.toPrecision(12)));
  } catch {
    return 'Error';
  }
}

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [scientific, setScientific] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CalcHistoryEntry[]>([
    { expr: '2048 × 16', result: '32768' },
    { expr: '1024 ÷ 8', result: '128' },
  ]);

  const appendToken = useCallback((token: string) => {
    setDisplay((prev) => {
      if (prev === 'Error') return token;
      if (prev === '0' && /^[0-9]$/.test(token)) return token;
      return prev + token;
    });
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => (prev.length <= 1 || prev === 'Error' ? '0' : prev.slice(0, -1)));
  }, []);

  const handleEquals = useCallback(() => {
    const res = safeEvaluate(display);
    setExpression(`${display} =`);
    if (res !== 'Error') {
      setHistory((prev) => [{ expr: display, result: res }, ...prev].slice(0, 12));
    }
    setDisplay(res);
  }, [display]);

  const applyUnary = (op: 'sqrt' | 'sq' | 'sin' | 'cos' | 'tan' | 'log' | 'neg') => {
    const num = Number(safeEvaluate(display));
    if (!Number.isFinite(num)) {
      setDisplay('Error');
      return;
    }
    let out = num;
    let label = '';
    switch (op) {
      case 'sqrt':
        out = Math.sqrt(num);
        label = `√(${display})`;
        break;
      case 'sq':
        out = num * num;
        label = `(${display})²`;
        break;
      case 'sin':
        out = Math.sin((num * Math.PI) / 180);
        label = `sin(${display}°)`;
        break;
      case 'cos':
        out = Math.cos((num * Math.PI) / 180);
        label = `cos(${display}°)`;
        break;
      case 'tan':
        out = Math.tan((num * Math.PI) / 180);
        label = `tan(${display}°)`;
        break;
      case 'log':
        out = Math.log10(num);
        label = `log₁₀(${display})`;
        break;
      case 'neg':
        out = -num;
        label = `-(${display})`;
        break;
    }
    const formatted = Number.isFinite(out) ? String(Number(out.toPrecision(10))) : 'Error';
    setExpression(label);
    setDisplay(formatted);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }
      if (/^[0-9.()+\-*/]$/.test(e.key)) {
        const mapped = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
        appendToken(mapped);
      } else if (e.key === 'Enter' || e.key === '=') {
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [appendToken, handleBackspace, handleClear, handleEquals]);

  const standardKeys = [
    ['C', '(', ')', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['±', '0', '.', '='],
  ];

  return (
    <div className="h-full flex flex-col bg-[#080A0F] text-[#E6EAF0]">
      {/* Mode Header */}
      <div className="px-3.5 py-2 border-b border-white/[0.08] bg-[#0C0F16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScientific(false)}
            style={!scientific ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' } : undefined}
            className={`px-2.5 py-1 rounded-none text-[11px] font-mono transition-colors ${
              !scientific ? '' : 'text-[#8E9AA9] hover:text-white'
            }`}
          >
            STD
          </button>
          <button
            type="button"
            onClick={() => setScientific(true)}
            style={scientific ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' } : undefined}
            className={`px-2.5 py-1 rounded-none text-[11px] font-mono transition-colors ${
              scientific ? '' : 'text-[#8E9AA9] hover:text-white'
            }`}
          >
            SCI
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory((h) => !h)}
          style={showHistory ? { color: 'var(--sl8-accent)' } : undefined}
          className="p-1.5 text-[#8E9AA9] hover:text-white transition-colors"
          aria-label="Toggle calculation history"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Display Screen */}
      <div className="px-4 py-5 bg-[#06080C] border-b border-white/[0.08] text-right shrink-0">
        <p className="text-xs font-mono text-[#7F8B9B] min-h-[16px] truncate tabular-nums">{expression}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="p-1.5 text-[#7F8B9B] hover:text-white shrink-0"
          >
            <Delete className="w-4 h-4" />
          </button>
          <p className="font-display text-3xl font-semibold text-white truncate tabular-nums">{display}</p>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] bg-[#0A0D14]">
          {history.map((item, i) => (
            <button
              key={`${item.expr}-${i}`}
              type="button"
              onClick={() => {
                setDisplay(item.result);
                setExpression(item.expr);
                setShowHistory(false);
              }}
              className="w-full px-4 py-3 text-right hover:bg-white/[0.04] transition-colors"
            >
              <p className="text-xs font-mono text-[#7F8B9B] tabular-nums">{item.expr}</p>
              <p className="font-display text-lg font-semibold text-white tabular-nums">{item.result}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-2 gap-1.5">
          {scientific && (
            <div className="grid grid-cols-4 gap-1.5 shrink-0">
              {(
                [
                  { label: 'sin', fn: () => applyUnary('sin') },
                  { label: 'cos', fn: () => applyUnary('cos') },
                  { label: 'tan', fn: () => applyUnary('tan') },
                  { label: 'log', fn: () => applyUnary('log') },
                  { label: '√x', fn: () => applyUnary('sqrt') },
                  { label: 'x²', fn: () => applyUnary('sq') },
                  { label: 'π', fn: () => appendToken('π') },
                  { label: 'e', fn: () => appendToken('e') },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.fn}
                  className="py-2 rounded-none bg-[#0D1119] hover:bg-[#171E2B] border border-white/[0.08] text-xs font-mono text-[#B9C2CF] hover:text-white transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 grid grid-cols-4 gap-1.5">
            {standardKeys.flat().map((key) => {
              const isEquals = key === '=';
              const isOperator = ['÷', '×', '-', '+'].includes(key);
              const isClear = key === 'C';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') handleClear();
                    else if (key === '=') handleEquals();
                    else if (key === '±') applyUnary('neg');
                    else appendToken(key);
                  }}
                  style={
                    isEquals
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : isOperator
                      ? { color: 'var(--sl8-accent)' }
                      : undefined
                  }
                  className={`rounded-none border text-base font-display font-medium transition-colors flex items-center justify-center ${
                    isEquals
                      ? 'border-transparent font-semibold hover:opacity-90'
                      : isClear
                      ? 'bg-[#171219] hover:bg-red-500/20 border-white/10 text-red-300'
                      : isOperator
                      ? 'bg-[#0F141E] hover:bg-[#182130] border-white/10'
                      : 'bg-[#0B0F16] hover:bg-[#151B26] border-white/[0.08] text-white'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
