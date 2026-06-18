import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Without these, `createClient` throws at import time and the app renders a
// blank white screen. Surface a readable message instead so the cause is clear
// (almost always: env vars not set in the Vercel project, then redeploy).
if (!url || !anonKey) {
  const missing = [
    !url && 'VITE_SUPABASE_URL',
    !anonKey && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ');

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;padding:24px">
        <div style="max-width:440px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;box-shadow:0 10px 30px -12px rgb(15 23 42 / 0.2)">
          <h1 style="margin:0 0 8px;font-size:18px;color:#0f172a">Configuration error</h1>
          <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.5">
            Missing environment variable(s): <strong>${missing}</strong>.
          </p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">
            Add them in <strong>Vercel → Settings → Environment Variables</strong>, then redeploy.
            Vite inlines these at build time, so a redeploy is required.
          </p>
        </div>
      </div>`;
  }
  throw new Error(`Missing Supabase env vars: ${missing}`);
}

export const supabase = createClient(url, anonKey);
