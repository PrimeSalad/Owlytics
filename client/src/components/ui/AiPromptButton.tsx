import { useState } from 'react';
import { Wand2, Loader2, Sparkles, CornerDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { runAiPrompt, getGeminiKey, AiKeyError } from '@/lib/aiGrammar';
import { GeminiKeyDialog } from './GeminiKeyDialog';

interface AiPromptButtonProps {
  /** Current text the instruction will be applied to (may be empty to draft from scratch). */
  text: string;
  /** Called with the AI result when applied (or with the original text on undo). */
  onApply: (result: string) => void;
  disabled?: boolean;
  className?: string;
}

const PRESETS = [
  'Make it more formal',
  'Make it concise',
  'Expand with more detail',
  'Fix & improve the writing',
  'Translate to English',
  'Translate to Filipino',
];

/** "Ask AI" button — runs a user-written instruction over the field text. */
export function AiPromptButton({ text, onApply, disabled, className }: AiPromptButtonProps) {
  const [open, setOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | undefined>();
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  async function run() {
    const ins = instruction.trim();
    if (!ins) {
      toast.error('Type what you want the AI to do.');
      return;
    }
    const key = getGeminiKey();
    if (!key) {
      setKeyNotice(undefined);
      setKeyOpen(true);
      return;
    }
    try {
      setLoading(true);
      const result = await runAiPrompt(text, ins, key);
      const previous = text;
      onApply(result);
      setOpen(false);
      toast(
        (t) => (
          <span className="flex items-center gap-3 text-sm">
            <span>Applied AI edit ✨</span>
            <button
              type="button"
              onClick={() => {
                onApply(previous);
                toast.dismiss(t.id);
              }}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Undo
            </button>
          </span>
        ),
        { icon: '✨', duration: 6000 },
      );
    } catch (err: any) {
      toast.error(err?.message ?? 'AI request failed.');
      if (err instanceof AiKeyError) {
        setKeyNotice(err.message);
        setKeyOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title="Ask AI to rewrite or improve this with your own instruction"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 transition-all duration-200 ease-out-expo hover:bg-violet-100 active:scale-[0.97] disabled:opacity-50',
          className,
        )}
      >
        <Wand2 className="h-3 w-3" /> Ask AI
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_24px_70px_-12px_rgb(15_23_42_/_0.45)] ring-1 ring-black/5 backdrop-blur-2xl">
            <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-400/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-brand-400/30 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

            <div className="relative">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-[0_8px_24px_-6px_rgb(139_92_246_/_0.5)] ring-1 ring-white/40">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-none text-slate-900">Ask AI</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    {text.trim() ? 'Rewrites the current text with your instruction' : 'Drafts text from your instruction'}
                  </p>
                </div>
              </div>

              {/* Preset chips */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setInstruction(p)}
                    className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <textarea
                autoFocus
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    run();
                  }
                }}
                rows={3}
                placeholder="e.g. Rewrite this in a more formal tone and fix any grammar mistakes…"
                className="w-full resize-none rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-slate-800 shadow-inner outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-violet-400 focus:bg-white/90 focus:ring-4 focus:ring-violet-500/15"
              />

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:inline-flex">
                  <CornerDownLeft className="h-3 w-3" /> Ctrl/⌘ + Enter to run
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={run}
                    disabled={loading || !instruction.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-btn ring-1 ring-white/30 transition hover:shadow-[0_8px_24px_-6px_rgb(139_92_246_/_0.5)] active:scale-[0.97] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {loading ? 'Working…' : 'Run'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <GeminiKeyDialog
        open={keyOpen}
        notice={keyNotice}
        onClose={() => setKeyOpen(false)}
        onSaved={run}
      />
    </>
  );
}
