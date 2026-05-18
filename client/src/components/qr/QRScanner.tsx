import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Volume2, VolumeX, AlertCircle, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui';

export interface ScanResult {
  studentId: string;
  status: 'Present' | 'Late' | 'Absent';
  timestamp: string;
  scannedAt: string;
}

interface QRScannerProps {
  eventId: string;
  scheduleId: string;
  sessionId: string;
  onScanSuccess?: (result: ScanResult) => void;
}

const SCAN_BUFFER_KEY = 'qr_scan_buffer';
const SCANNER_ID = 'qr-scanner';

export const QRScanner: React.FC<QRScannerProps> = ({ eventId, scheduleId, sessionId, onScanSuccess }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScans, setLastScans] = useState<ScanResult[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize scanner
  useEffect(() => {
    const initScanner = async () => {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          SCANNER_ID,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          false
        );

        scannerRef.current.render(
          async (decodedText: string) => {
            await handleScan(decodedText);
          },
          (error: any) => {
            // Suppress error logs for continuous scanning
          }
        );

        setIsScanning(true);
      } catch (error: any) {
        console.error('Scanner initialization error:', error);
        toast.error('Failed to initialize camera. Check permissions.');
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error clearing scanner:', e);
        }
      }
    };
  }, []);

  // Play beep sound for successful scan
  const playBeep = () => {
    if (isMuted) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio context error:', e);
    }
  };

  // Handle QR scan
  const handleScan = async (qrData: string) => {
    try {
      playBeep();

      if (isOnline) {
        try {
          const response = await api.post('/attendance/scan', {
            qrData,
            eventId,
            scheduleId,
            sessionId,
          });

          const result: ScanResult = {
            studentId: response.data.studentId,
            status: response.data.status,
            timestamp: response.data.timestamp,
            scannedAt: new Date().toLocaleTimeString(),
          };

          setScanCount((prev) => prev + 1);
          setLastScans((prev) => [result, ...prev.slice(0, 9)]);
          onScanSuccess?.(result);

          toast.success(`${response.data.studentName} — ${response.data.status}`);
        } catch (error: any) {
          const message = error.response?.data?.error || 'Scan failed';
          toast.error(message);
        }
      } else {
        const offlineResult: ScanResult = {
          studentId: qrData,
          status: 'Present',
          timestamp: new Date().toISOString(),
          scannedAt: new Date().toLocaleTimeString(),
        };

        bufferOfflineScan({
          qrData,
          eventId,
          scheduleId,
          sessionId,
          timestamp: new Date().toISOString(),
        });

        setScanCount((prev) => prev + 1);
        setLastScans((prev) => [offlineResult, ...prev.slice(0, 9)]);

        toast.success('Buffered (offline) — Will sync when connected', {
          icon: '📱',
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
    }
  };

  // Buffer offline scans to localStorage
  const bufferOfflineScan = (scan: any) => {
    const buffer = JSON.parse(localStorage.getItem(SCAN_BUFFER_KEY) || '[]');
    buffer.push(scan);
    localStorage.setItem(SCAN_BUFFER_KEY, JSON.stringify(buffer));
  };

  // Sync buffered scans
  const syncOfflineScans = async () => {
    const buffer = JSON.parse(localStorage.getItem(SCAN_BUFFER_KEY) || '[]');
    if (buffer.length === 0) return;

    setIsSyncing(true);
    try {
      const response = await api.post('/attendance/sync', { scans: buffer });

      localStorage.removeItem(SCAN_BUFFER_KEY);
      toast.success(`Synced ${response.data.syncedCount} buffered scans`);

      setScanCount((prev) => prev + response.data.syncedCount);
    } catch (error: any) {
      toast.error(`Sync failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const bufferedCount = JSON.parse(localStorage.getItem(SCAN_BUFFER_KEY) || '[]').length;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 border border-blue-200">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-sm font-medium text-slate-700">
            {isOnline ? '🟢 Online' : '🟡 Offline — Scanning buffered locally'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg hover:bg-blue-100 transition"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-slate-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-blue-600" />
            )}
          </button>
          {!isOnline && (
            <Button
              size="sm"
              onClick={syncOfflineScans}
              disabled={isSyncing || bufferedCount === 0}
              className="ml-2"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </div>

      {/* Scanner container */}
      <div className="rounded-lg overflow-hidden shadow-lg bg-black">
        <div id={SCANNER_ID} className="w-full bg-black" style={{ minHeight: '400px' }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
          <p className="text-xs font-medium text-slate-600 uppercase">Scans Today</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{scanCount}</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200">
          <p className="text-xs font-medium text-slate-600 uppercase">Buffer</p>
          <p className="text-3xl font-bold text-slate-600 mt-1">{bufferedCount}</p>
        </div>
      </div>

      {/* Recent scans */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700">Recent Scans</h3>
        </div>
        <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
          {lastScans.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400">No scans yet</div>
          ) : (
            lastScans.map((scan, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium text-slate-700">{scan.studentId}</p>
                  <p className="text-xs text-slate-400">{scan.scannedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      scan.status === 'Present'
                        ? 'bg-green-100 text-green-700'
                        : scan.status === 'Late'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {scan.status}
                  </span>
                  {isOnline && <Check className="h-4 w-4 text-green-600" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Scanner Tips:</p>
          <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
            <li>Hold QR code steady in the frame</li>
            <li>Ensure good lighting for accurate reading</li>
            <li>Scans are automatically buffered if you go offline</li>
            <li>Audio feedback can be toggled with the speaker icon</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
