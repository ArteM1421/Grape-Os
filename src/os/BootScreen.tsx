import { useEffect, useState, useRef } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_STEPS: { label: string; duration: number }[] = [
  { label: 'Initializing VinGrape OS...', duration: 300 },
  { label: 'Loading kernel modules...', duration: 250 },
  { label: 'Starting window manager...', duration: 250 },
  { label: 'Loading theme engine...', duration: 200 },
  { label: 'Mounting file systems...', duration: 200 },
  { label: 'Starting system services...', duration: 250 },
  { label: 'VinGrape OS ready', duration: 200 },
];

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const timersRef = useRef<number[]>([]);
  const [brandIcon, setBrandIcon] = useState(() => localStorage.getItem('vingrape-icon-url') ?? '');
  const [osName, setOsName] = useState(() => localStorage.getItem('vingrape-os-name') ?? 'VinGrape');

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowLogo(true), 100);
    timersRef.current.push(t1);

    let elapsed = 0;

    BOOT_STEPS.forEach((bootStep, i) => {
      const startT = window.setTimeout(() => {
        setStep(i);
      }, elapsed);
      timersRef.current.push(startT);

      const doneT = window.setTimeout(() => {
        setProgress(Math.round(((i + 1) / BOOT_STEPS.length) * 100));
        if (i === BOOT_STEPS.length - 1) {
          const fadeT = window.setTimeout(() => setFadingOut(true), 300);
          const completeT = window.setTimeout(() => onComplete(), 700);
          timersRef.current.push(fadeT, completeT);
        }
      }, elapsed + bootStep.duration);
      timersRef.current.push(doneT);

      elapsed += bootStep.duration;
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(10,132,255,0.06), transparent 60%), #0a0a0c',
      }}
    >
      {/* Logo */}
      <div
        className={`relative mb-10 transition-all duration-700 ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center overflow-hidden">
            <img src={brandIcon || "https://cdn-icons-png.flaticon.com/128/8832/8832714.png"} alt="VinGrape" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
            {osName}
          </h1>
          <p className="text-xs mt-1 font-mono" style={{ color: '#8a8a90' }}>
            made by ArtGroup (Artem Malmygin)
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-72 max-w-[80vw]">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full accent-gradient transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono" style={{ color: '#8a8a90' }}>
          <span>{BOOT_STEPS[step]?.label ?? 'Starting...'}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
