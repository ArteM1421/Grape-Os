import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Shield, Terminal, HardDrive, AlertTriangle, Check, Loader2, Trash2, RefreshCw, Database } from 'lucide-react';

interface RecoveryScreenProps {
  onExit: () => void;
  onReboot: () => void;
}

type RecoveryAction = 'restart' | 'fsck' | 'reset' | 'terminal' | 'clear-cache' | 'repair' | null;

interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function RecoveryScreen({ onExit, onReboot }: RecoveryScreenProps) {
  const [action, setAction] = useState<RecoveryAction>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [done, setDone] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const runAction = async (id: RecoveryAction) => {
    setAction(id);
    setDone(false);
    setLogs([]);

    if (id === 'restart') {
      addLog('Preparing to restart...', 'info');
      setTimeout(() => { setDone(true); }, 800);
      return;
    }

    if (id === 'fsck') {
      const steps = [
        'Scanning system files...',
        'Checking boot sector...',
        'Verifying kernel integrity...',
        'Checking theme files...',
        'Checking app registry...',
        'All system files verified. No issues found.',
      ];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        addLog(steps[i], i === steps.length - 1 ? 'success' : 'info');
      }
      setDone(true);
      return;
    }

    if (id === 'reset') {
      const steps = [
        'Resetting theme to default...',
        'Clearing custom settings...',
        'Restoring default app names...',
        'Settings have been reset to defaults.',
      ];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        if (i === 0) localStorage.removeItem('pyos-theme');
        if (i === 1) localStorage.removeItem('vingrape-os-name');
        if (i === 2) localStorage.removeItem('vingrape-app-renames');
        addLog(steps[i], i === steps.length - 1 ? 'success' : 'info');
      }
      window.dispatchEvent(new Event('vingrape-settings-change'));
      setDone(true);
      return;
    }

    if (id === 'clear-cache') {
      const steps = [
        'Clearing localStorage cache...',
        'Clearing session storage...',
        'Clearing temporary files...',
        'Cache cleared successfully.',
      ];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 300));
        if (i === 0) {
          const keep = ['vingrape-bios-settings'];
          const toKeep: Record<string, string> = {};
          keep.forEach((k) => { const v = localStorage.getItem(k); if (v) toKeep[k] = v; });
          localStorage.clear();
          Object.entries(toKeep).forEach(([k, v]) => localStorage.setItem(k, v));
        }
        if (i === 1) sessionStorage.clear();
        addLog(steps[i], i === steps.length - 1 ? 'success' : 'info');
      }
      setDone(true);
      return;
    }

    if (id === 'repair') {
      const steps = [
        'Re-registering core applications...',
        'Rebuilding app registry...',
        'Repairing window manager...',
        'Reloading theme engine...',
        'System repair complete.',
      ];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        addLog(steps[i], i === steps.length - 1 ? 'success' : 'info');
      }
      window.dispatchEvent(new Event('vingrape-settings-change'));
      setDone(true);
      return;
    }

    if (id === 'terminal') {
      addLog('Recovery terminal ready. Type "help" for commands.', 'info');
      return;
    }
  };

  const handleTerminalCommand = (cmd: string) => {
    setTerminalHistory((prev) => [...prev, `$ ${cmd}`]);
    const lower = cmd.toLowerCase().trim();
    if (lower === 'help') {
      setTerminalHistory((prev) => [...prev, 'Commands: help, clear, reset, restart, scan, exit']);
    } else if (lower === 'clear') {
      setTerminalHistory([]);
    } else if (lower === 'reset') {
      localStorage.removeItem('pyos-theme');
      localStorage.removeItem('vingrape-os-name');
      setTerminalHistory((prev) => [...prev, 'Settings reset.']);
    } else if (lower === 'restart') {
      setTerminalHistory((prev) => [...prev, 'Rebooting...']);
      setTimeout(onReboot, 500);
    } else if (lower === 'scan') {
      setTerminalHistory((prev) => [...prev, 'System integrity: OK', 'No issues found.']);
    } else if (lower === 'exit') {
      setAction(null);
    } else if (lower) {
      setTerminalHistory((prev) => [...prev, `Unknown command: ${cmd}`]);
    }
    setTerminalInput('');
  };

  const actions = [
    { id: 'restart' as const, label: 'Restart Normally', icon: RotateCcw, desc: 'Boot into the desktop normally' },
    { id: 'fsck' as const, label: 'Verify System Integrity', icon: Shield, desc: 'Check and repair system files' },
    { id: 'repair' as const, label: 'Repair System', icon: RefreshCw, desc: 'Re-register apps and rebuild system' },
    { id: 'reset' as const, label: 'Reset Settings', icon: HardDrive, desc: 'Reset all settings to defaults' },
    { id: 'clear-cache' as const, label: 'Clear Cache', icon: Trash2, desc: 'Clear browser cache and temp files' },
    { id: 'terminal' as const, label: 'Recovery Terminal', icon: Terminal, desc: 'Open a recovery shell' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(255,69,58,0.06), transparent 60%), linear-gradient(180deg, #1c1c1e, #0a0a0c)',
      }}
    >
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,69,58,0.15)' }}>
            <AlertTriangle size={24} style={{ color: '#ff453a' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#e8e8ec' }}>VinGrape Recovery</h1>
            <p className="text-xs" style={{ color: '#8a8a90' }}>Choose an option to continue</p>
          </div>
        </div>

        {!action && (
          <div className="space-y-2">
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => runAction(a.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl glass-panel hover:bg-white/8 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <a.icon size={18} style={{ color: '#0a84ff' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e8e8ec' }}>{a.label}</p>
                  <p className="text-xs" style={{ color: '#8a8a90' }}>{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {action === 'terminal' && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
              <Terminal size={14} style={{ color: '#0a84ff' }} />
              <span className="text-xs font-medium" style={{ color: '#e8e8ec' }}>Recovery Terminal</span>
            </div>
            <div className="p-4 font-mono text-xs h-64 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)', color: '#30d158' }}>
              {terminalHistory.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
              ))}
              <div className="flex items-center gap-1 mt-1">
                <span style={{ color: '#0a84ff' }}>$</span>
                <input
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTerminalCommand(terminalInput); }}
                  className="flex-1 bg-transparent outline-none"
                  style={{ color: '#30d158' }}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-4 py-2 border-t border-white/10">
              <button onClick={() => setAction(null)} className="text-xs hover:underline" style={{ color: '#8a8a90' }}>Back</button>
            </div>
          </div>
        )}

        {action && action !== 'terminal' && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-6">
              {!done ? (
                <div className="flex flex-col items-center">
                  <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#0a84ff' }} />
                  <p className="text-sm mb-4" style={{ color: '#8a8a90' }}>Processing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(48,209,88,0.15)' }}>
                    <Check size={24} style={{ color: '#30d158' }} />
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#e8e8ec' }}>
                    {action === 'fsck' && 'System integrity verified. No issues found.'}
                    {action === 'reset' && 'Settings have been reset to defaults.'}
                    {action === 'clear-cache' && 'Cache cleared successfully.'}
                    {action === 'repair' && 'System repair complete.'}
                    {action === 'restart' && 'Ready to restart.'}
                  </p>
                  <button
                    onClick={action === 'restart' ? onReboot : onExit}
                    className="px-6 py-2.5 rounded-xl accent-gradient text-black/80 font-medium text-sm hover:scale-105 transition-transform"
                  >
                    {action === 'restart' ? 'Restart Now' : 'Continue'}
                  </button>
                </div>
              )}
              {logs.length > 0 && (
                <div ref={logRef} className="mt-4 p-3 rounded-lg font-mono text-[10px] max-h-40 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{ color: log.type === 'success' ? '#30d158' : log.type === 'error' ? '#ff453a' : log.type === 'warning' ? '#ffd60a' : '#8a8a90' }}>
                      {log.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onExit}
          className="mt-6 w-full text-center text-xs hover:underline"
          style={{ color: '#5a5a5e' }}
        >
          Back to desktop
        </button>
      </div>
    </div>
  );
}
