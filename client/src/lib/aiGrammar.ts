// ── AI grammar assist (Bring Your Own Key) ──────────────────────────────────
// Each user pastes their own free Google Gemini API key. It is stored ONLY in
// this browser's localStorage and used to call Gemini directly from the client —
// the key is never sent to our server or database.

const KEY_STORAGE = 'owlytics_gemini_key';
// Tried in order — the first model with available free-tier quota for the user's
// key/region wins. Different models have separate free quota buckets, so if one
// reports "limit: 0" we fall through to the next.
const MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
const endpointFor = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const GEMINI_KEY_URL = 'https://aistudio.google.com/app/apikey';

/**
 * Thrown when the failure is tied to the API key itself — an invalid/unauthorized
 * key or a hit rate-limit/quota. The UI uses this to prompt for a different key.
 */
export class AiKeyError extends Error {
  /** True when the failure is a quota / rate-limit (vs. an invalid key). */
  isQuota: boolean;
  constructor(message: string, isQuota = false) {
    super(message);
    this.name = 'AiKeyError';
    this.isQuota = isQuota;
  }
}

export function getGeminiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setGeminiKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    /* storage unavailable (private mode) — ignore */
  }
}

export function clearGeminiKey(): void {
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

export function hasGeminiKey(): boolean {
  return getGeminiKey().length > 0;
}

/** Remove markdown fences / surrounding quotes a model sometimes adds. */
function cleanup(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
  const pairs: [string, string][] = [['"', '"'], ['“', '”'], ['「', '」']];
  for (const [open, close] of pairs) {
    if (t.length > 1 && t.startsWith(open) && t.endsWith(close)) {
      t = t.slice(open.length, t.length - close.length).trim();
      break;
    }
  }
  return t;
}

/** Call a single Gemini model. Throws AiKeyError (isQuota=true on 429) or Error. */
async function callModel(model: string, prompt: string, apiKey: string, temperature: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(endpointFor(model), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, topP: 0.9 },
      }),
    });
  } catch {
    throw new Error('Could not reach the AI service. Check your internet connection.');
  }

  if (!res.ok) {
    // Surface Google's actual reason instead of guessing.
    let detail = '';
    try {
      detail = (await res.json())?.error?.message ?? '';
    } catch {
      /* ignore */
    }

    if (res.status === 401 || res.status === 403) {
      throw new AiKeyError(detail || 'Invalid or unauthorized API key. Try a different key.');
    }
    if (res.status === 400) {
      throw new AiKeyError(detail || 'The request was rejected. Check that your API key is correct.');
    }
    if (res.status === 429) {
      throw new AiKeyError(detail || 'Rate limit / quota reached.', true);
    }
    throw new Error(detail || `AI request failed (${res.status}).`);
  }

  const data = await res.json();

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error('The AI declined to process this text. Try rephrasing it.');
  }

  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const out = parts.map((p) => p.text ?? '').join('').trim();
  if (!out) {
    throw new Error('The AI returned an empty response. Please try again.');
  }
  return cleanup(out);
}

/**
 * Send a prompt to Gemini, automatically falling through models that have no
 * free-tier quota (limit: 0) for this key. Throws a user-friendly Error otherwise.
 */
async function generate(prompt: string, apiKey: string, temperature = 0.3): Promise<string> {
  let lastQuotaError: AiKeyError | null = null;

  for (const model of MODELS) {
    try {
      return await callModel(model, prompt, apiKey, temperature);
    } catch (err) {
      // Quota/limit on this model → try the next one (separate quota buckets).
      if (err instanceof AiKeyError && err.isQuota) {
        lastQuotaError = err;
        continue;
      }
      throw err;
    }
  }

  throw new AiKeyError(
    "All free models are out of quota for this key. Your Google project/region likely has no free Gemini quota — try a key from a different Google account, or enable billing." +
      (lastQuotaError ? ` (Last detail: ${lastQuotaError.message})` : ''),
    true,
  );
}

/**
 * Send `text` to Gemini and return a grammar/spelling-corrected version.
 */
export function fixGrammar(text: string, apiKey: string): Promise<string> {
  const prompt = `You are a proofreader for a student organization's official reports.
Correct the spelling, grammar, capitalization, and punctuation of the text below.

Rules:
- Keep the original meaning and all facts. Do NOT invent or remove details.
- Keep the SAME language (English, Filipino, or Taglish — do not translate).
- Use a clear, professional tone suitable for an official report.
- Return ONLY the corrected text. No quotes, labels, or explanations.

TEXT:
${text}`;
  return generate(prompt, apiKey, 0.2);
}

/**
 * Apply a user's custom instruction to their report text (or generate from the
 * instruction alone when `text` is empty). Returns the resulting text only.
 */
export function runAiPrompt(text: string, instruction: string, apiKey: string): Promise<string> {
  const hasText = text.trim().length > 0;
  const prompt = `You are an AI writing assistant helping a student write part of an official student-organization report.

Follow the INSTRUCTION below${hasText ? ' and apply it to the TEXT.' : ' to write the requested text.'}

Rules:
- Keep the result appropriate and professional for an official report.
- Do NOT invent specific facts (names, dates, numbers) that are not given. If asked to expand, only elaborate on what is provided.
- Keep the same language as the text/instruction unless explicitly told to translate.
- Return ONLY the resulting text — no quotes, labels, or commentary.

INSTRUCTION:
${instruction}
${hasText ? `\nTEXT:\n${text}` : ''}`;
  return generate(prompt, apiKey, 0.5);
}
