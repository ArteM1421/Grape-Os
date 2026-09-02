import { useState, useEffect } from 'react';
import { Lock, User } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  clock: Date;
}

export default function LockScreen({ onUnlock, clock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const fmtTime = clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDate = clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showInput) {
        setShowInput(true);
        return;
      }
      if (e.key === 'Enter') {
        if (pin.length >= 1) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => setError(false), 600);
        }
      } else if (e.key === 'Backspace') {
        setPin((p) => p.slice(0, -1));
      } else if (/^[0-9]$/.test(e.key)) {
        setPin((p) => p + e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showInput, pin, onUnlock]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(10,132,255,0.08), transparent 60%), linear-gradient(180deg, #1c1c1e, #0a0a0c)',
      }}
    >
      {!showInput ? (
        <div
          className="text-center cursor-pointer animate-fade-in"
          onClick={() => setShowInput(true)}
        >
          <p className="text-7xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {fmtTime}
          </p>
          <p className="text-lg mb-12" style={{ color: '#8a8a90' }}>
            {fmtDate}
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center">
              <User size={36} style={{ color: '#8a8a90' }} />
            </div>
            <p className="text-sm" style={{ color: '#8a8a90' }}>
              Click or press any key to unlock
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full glass-panel flex items-center justify-center mx-auto mb-6">
            <Lock size={40} style={{ color: '#8a8a90' }} />
          </div>
          <p className="text-lg mb-6" style={{ color: '#e8e8ec' }}>
            Enter PIN to unlock
          </p>
          <div className={`flex gap-3 justify-center mb-4 ${error ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border-2 transition-all"
                style={{
                  borderColor: error ? '#ff453a' : '#5a5a5e',
                  background: i < pin.length ? (error ? '#ff453a' : '#0a84ff') : 'transparent',
                }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: '#5a5a5e' }}>
            Press Enter to unlock (any PIN works)
          </p>
        </div>
      )}
    </div>
  );
}
