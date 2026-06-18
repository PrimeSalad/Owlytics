import { useState } from 'react';
import { Sparkles, KeyRound, ExternalLink, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { setGeminiKey, clearGeminiKey, hasGeminiKey, GEMINI_KEY_URL } from '@/lib/aiGrammar';

interface GeminiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after a key is successfully saved (e.g. to auto-run the pending action). */
  onSaved?: () => void;
  /** Optional warning banner (e.g. shown when the previous key was invalid or rate-limited). */
  notice?: string;
}

/** Frosted-glass dialog for connecting / replacing the on-device Gemini API key. */
export function GeminiKeyDialog({ open, onClose, onSaved, notice }: GeminiKeyDialogProps) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(true);
  const [keySaved, setKeySaved] = useState(() => hasGeminiKey());

  if (!open) return null;

  function save() {
    const k = keyInput.trim();
    if (!k) {
      toast.error('Paste your Gemini API key first.');
      return;
    }
    setGeminiKey(k);
    setKeySaved(true);
    setKeyInput('');
    toast.success('API key saved on this device.');
    onSaved?.();
    onClose();
  }

  function remove() {
    clearGeminiKey();
    setKeySaved(false);
    toast('API key removed from this device.');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Frosted backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={onClose} />

      {/* Glass panel */}
      <div className="relative w-full max-w-sm animate-scale-in overflow-hidden rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_24px_70px_-12px_rgb(15_23_42_/_0.45)] ring-1 ring-black/5 backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-400/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-sky-400/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-glow ring-1 ring-white/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none text-slate-900">Connect Gemini AI</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Free · stored only on this device</p>
            </div>
          </div>

          {notice && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[11px] font-medium leading-relaxed text-amber-800">{notice}</p>
            </div>
          )}

          <p className="mb-4 text-xs leading-relaxed text-slate-600">
            Paste your <span className="font-semibold text-slate-700">free</span> Google Gemini API key. It's used
            to help with your report and is{' '}
            <span className="font-semibold text-slate-700">never sent to our servers</span>.
          </p>

          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your Gemini API key…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  save();
                }
              }}
              className="h-11 w-full rounded-2xl border border-white/70 bg-white/70 pl-10 pr-11 text-sm text-slate-800 shadow-inner outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-brand-400 focus:bg-white/90 focus:ring-4 focus:ring-brand-500/15"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              title={showKey ? 'Hide API key' : 'Show API key'}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <a
              href={GEMINI_KEY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700 hover:underline"
            >
              Get a free key <ExternalLink className="h-3 w-3" />
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-btn ring-1 ring-white/30 transition hover:shadow-brand-glow active:scale-[0.97]"
              >
                <Sparkles className="h-3 w-3" /> Save key
              </button>
            </div>
          </div>

          {keySaved && (
            <button
              type="button"
              onClick={remove}
              className="mt-4 inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 transition hover:text-danger-500"
            >
              <Trash2 className="h-3 w-3" /> Remove saved key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
