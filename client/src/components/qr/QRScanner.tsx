import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import toast from 'react-hot-toast';
import {
  Volume2, VolumeX, CheckCircle2, Clock, Pause, Play,
  SwitchCamera, RotateCcw, CameraOff, Wifi, WifiOff,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui';

export interface ScanResult {
  studentId: string;
  studentName: string;
  status: 'Present' | 'Late' | 'Absent';
  scannedAt: string;
}

interface QRScannerProps {
  eventId: string;
  scheduleId: string;
  sessionId: string;
  onScanSuccess?: (result: ScanResult) => void;
}

const SCAN_BUFFER_KEY = 'qr_scan_buffer';
const SCANNER_REGION_ID = 'qr-reader-region';
/** Ignore the same QR code if re-read within this window (camera fires ~10×/sec). */
const DUPLICATE_WINDOW_MS = 3000;

export function QRScanner({ eventId, scheduleId, sessionId, onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const processingRef = useRef(false);
  const decodeRef = useRef<(text: string) => void>(() => {});
  const facingRef = useRef<'environment' | 'user'>('environment');

  const [restartToken, setRestartToken] = useState(0);
  const [camState, setCamState] = useState<'starting' | 'running' | 'paused' | 'error'>('starting');
  const [isMuted, setIsMuted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScans, setLastScans] = useState<ScanResult[]>([]);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [bufferedCount, setBufferedCount] = useState(readBuffer().length);

  // ── Online / offline ──────────────────────────────────────────────
  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncOfflineScans(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
    // Run once on mount — listeners are added/removed together.
  }, []);

  // ── Beep ──────────────────────────────────────────────────────────
  const playBeep = () => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
      osc.onended = () => ctx.close();
    } catch {
      /* audio not available */
    }
  };

  // ── Scan handling (deduped + serialized) ──────────────────────────
  const processScan = async (qrData: string) => {
    if (isOnline) {
      try {
        const { data } = await api.post('/attendance/scan', { qrData, eventId, scheduleId, sessionId });
        const result: ScanResult = {
          studentId: data.studentId,
          studentName: data.studentName,
          status: data.status,
          scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        playBeep();
        setScanCount((n) => n + 1);
        setLastScans((prev) => [result, ...prev].slice(0, 12));
        setLastResult(result);
        onScanSuccess?.(result);
      } catch (err: any) {
        const message = err.response?.data?.error || 'Scan failed. Try again.';
        // 409 = already checked in for this session — show it as a notice, not an error.
        if (err.response?.status === 409) {
          toast(message, { icon: '✋' });
        } else {
          toast.error(message);
        }
      }
    } else {
      bufferOfflineScan({ qrData, eventId, scheduleId, sessionId, timestamp: new Date().toISOString() });
      const result: ScanResult = {
        studentId: qrData.split('|')[1] ?? qrData,
        studentName: 'Saved offline',
        status: 'Present',
        scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      playBeep();
      setScanCount((n) => n + 1);
      setLastScans((prev) => [result, ...prev].slice(0, 12));
      setLastResult(result);
      toast('Saved offline — will sync when reconnected', { icon: '📵' });
    }
  };

  const handleDecode = (decodedText: string) => {
    const now = Date.now();
    if (processingRef.current) return;
    if (decodedText === lastScanRef.current.text && now - lastScanRef.current.at < DUPLICATE_WINDOW_MS) return;
    lastScanRef.current = { text: decodedText, at: now };
    processingRef.current = true;
    Promise.resolve(processScan(decodedText)).finally(() => { processingRef.current = false; });
  };
  // Always call the freshest handler from the camera callback.
  decodeRef.current = handleDecode;

  // ── Camera lifecycle (StrictMode-safe) ────────────────────────────
  useEffect(() => {
    let active = true;
    const scanner = new Html5Qrcode(SCANNER_REGION_ID, false);
    setCamState('starting');

    scanner
      .start(
        { facingMode: facingRef.current },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText) => decodeRef.current(decodedText),
        () => {/* per-frame decode misses — ignored */},
      )
      .then(() => {
        if (!active) {
          // Effect was torn down while starting (e.g. StrictMode) — shut this one down.
          scanner.stop().then(() => scanner.clear()).catch(() => {});
          return;
        }
        scannerRef.current = scanner;
        setCamState('running');
      })
      .catch(() => {
        if (active) setCamState('error');
      });

    return () => {
      active = false;
      const teardown = async () => {
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            await scanner.stop();
          }
        } catch {/* not started yet */}
        try { scanner.clear(); } catch {/* nothing rendered */}
      };
      teardown();
      scannerRef.current = null;
    };
    // Re-initialize the scanner only when restartToken changes.
  }, [restartToken]);

  // ── Controls ──────────────────────────────────────────────────────
  const togglePause = () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.pause(true);
        setCamState('paused');
      } else if (scanner.getState() === Html5QrcodeScannerState.PAUSED) {
        scanner.resume();
        setCamState('running');
      }
    } catch {/* ignore */}
  };

  const flipCamera = () => {
    facingRef.current = facingRef.current === 'environment' ? 'user' : 'environment';
    setRestartToken((t) => t + 1);
  };

  const retry = () => setRestartToken((t) => t + 1);

  // ── Offline buffer ────────────────────────────────────────────────
  function bufferOfflineScan(scan: Record<string, unknown>) {
    const buffer = readBuffer();
    buffer.push(scan);
    localStorage.setItem(SCAN_BUFFER_KEY, JSON.stringify(buffer));
    setBufferedCount(buffer.length);
  }

  async function syncOfflineScans() {
    const buffer = readBuffer();
    if (buffer.length === 0) return;
    setIsSyncing(true);
    try {
      const { data } = await api.post('/attendance/sync', { scans: buffer });
      localStorage.removeItem(SCAN_BUFFER_KEY);
      setBufferedCount(0);
      const synced = data.success ?? data.syncedCount ?? buffer.length;
      setScanCount((n) => n + synced);
      toast.success(`Synced ${synced} offline scan${synced === 1 ? '' : 's'}`);
    } catch (err: any) {
      toast.error(`Sync failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4 text-success-600" /> : <WifiOff className="h-4 w-4 text-warning-600" />}
          <span className="text-sm font-semibold text-slate-700">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="text-xs text-slate-400">
            {isOnline ? '· scans save instantly' : '· scans are saved on this device'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            title={isMuted ? 'Unmute beep' : 'Mute beep'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {bufferedCount > 0 && (
            <Button size="sm" onClick={syncOfflineScans} disabled={isSyncing || !isOnline}>
              {isSyncing ? 'Syncing…' : `Sync ${bufferedCount}`}
            </Button>
          )}
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-lg">
        <div id={SCANNER_REGION_ID} className="w-full [&_video]:!w-full [&_video]:!object-cover" style={{ minHeight: 360 }} />

        {/* Framing guide */}
        {camState === 'running' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {/* Starting overlay */}
        {camState === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-sm font-medium">Starting camera…</p>
          </div>
        )}

        {/* Paused overlay */}
        {camState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/70 text-white">
            <Pause className="h-8 w-8" />
            <p className="text-sm font-medium">Scanning paused</p>
            <Button size="sm" variant="secondary" onClick={togglePause}>
              <Play className="mr-1.5 h-4 w-4" /> Resume
            </Button>
          </div>
        )}

        {/* Error overlay */}
        {camState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/85 px-6 text-center text-white">
            <CameraOff className="h-9 w-9 text-slate-300" />
            <div>
              <p className="text-sm font-semibold">Can&apos;t access the camera</p>
              <p className="mt-1 text-xs text-slate-300">
                Allow camera access in your browser, then try again. A USB scanner also works.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={retry}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Retry
            </Button>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={togglePause} disabled={camState !== 'running' && camState !== 'paused'}>
          {camState === 'paused' ? <><Play className="mr-1.5 h-4 w-4" /> Resume</> : <><Pause className="mr-1.5 h-4 w-4" /> Pause</>}
        </Button>
        <Button variant="secondary" size="sm" onClick={flipCamera} disabled={camState === 'starting'}>
          <SwitchCamera className="mr-1.5 h-4 w-4" /> Flip camera
        </Button>
      </div>

      {/* Last scan highlight */}
      {lastResult && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${statusBg(lastResult.status)}`}>
          <CheckCircle2 className={`h-8 w-8 shrink-0 ${statusIcon(lastResult.status)}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{lastResult.studentName}</p>
            <p className="font-mono text-xs text-slate-500">{lastResult.studentId} · {lastResult.scannedAt}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusPill(lastResult.status)}`}>
            {lastResult.status}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scanned this session</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{scanCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Waiting to sync</p>
          <p className="mt-1 text-3xl font-bold text-slate-700">{bufferedCount}</p>
        </div>
      </div>

      {/* Recent scans */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">Recent scans</h3>
        </div>
        <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
          {lastScans.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No scans yet — point the camera at a student QR code.</p>
          ) : (
            lastScans.map((scan, idx) => (
              <div key={`${scan.studentId}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{scan.studentName}</p>
                  <p className="font-mono text-xs text-slate-400">{scan.studentId} · {scan.scannedAt}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusPill(scan.status)}`}>
                  {scan.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function readBuffer(): Record<string, unknown>[] {
  try {
    return JSON.parse(localStorage.getItem(SCAN_BUFFER_KEY) || '[]');
  } catch {
    return [];
  }
}

function statusPill(status: ScanResult['status']) {
  if (status === 'Present') return 'bg-success-50 text-success-700';
  if (status === 'Late') return 'bg-warning-50 text-warning-700';
  return 'bg-danger-50 text-danger-700';
}
function statusBg(status: ScanResult['status']) {
  if (status === 'Present') return 'border-success-200 bg-success-50/60';
  if (status === 'Late') return 'border-warning-200 bg-warning-50/60';
  return 'border-danger-200 bg-danger-50/60';
}
function statusIcon(status: ScanResult['status']) {
  if (status === 'Present') return 'text-success-600';
  if (status === 'Late') return 'text-warning-600';
  return 'text-danger-600';
}

export default QRScanner;
