import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { fixGrammar, getGeminiKey, AiKeyError } from '@/lib/aiGrammar';
import { GeminiKeyDialog } from './GeminiKeyDialog';

interface AiGrammarButtonProps {
  /** Current text to proofread. */
  text: string;
  /** Called with the corrected text when the user applies (or undoes) a fix. */
  onApply: (fixed: string) => void;
  disabled?: boolean;
  className?: string;
}

/** "Fix grammar" button — uses the user's own Gemini key (stored on-device). */
export function AiGrammarButton({ text, onApply, disabled, className }: AiGrammarButtonProps) {
  const [loading, setLoading] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | undefined>();

  async function runFix() {
    if (!text.trim()) {
      toast.error('There is no text to fix yet.');
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
      const fixed = await fixGrammar(text, key);
      if (fixed.trim() === text.trim()) {
        toast('Grammar already looks good 👍');
        return;
      }
      const previous = text;
      onApply(fixed);
      toast(
        (t) => (
          <span className="flex items-center gap-3 text-sm">
            <span>Fixed by AI ✨</span>
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
        onClick={runFix}
        disabled={disabled || loading}
        title="Fix grammar & spelling with AI"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 transition-all duration-200 ease-out-expo hover:bg-brand-100 active:scale-[0.97] disabled:opacity-50',
          className,
        )}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {loading ? 'Fixing…' : 'Fix grammar'}
      </button>

      <GeminiKeyDialog
        open={keyOpen}
        notice={keyNotice}
        onClose={() => setKeyOpen(false)}
        onSaved={runFix}
      />
    </>
  );
}
