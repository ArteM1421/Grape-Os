import { useState, useRef, useEffect, useCallback } from 'react';
import type { AppProps } from '../os/types';

interface Line {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const HELP_TEXT = `PyOS Terminal — Available commands:
  help        Show this help
  echo <msg>  Print text
  ls          List files
  cat <file>  Display file contents
  date        Show current date/time
  whoami      Show current user
  neofetch    System information
  clear       Clear the terminal
  apps        List installed applications
  theme       Show current theme
  about       About PyOS
  exit        Close terminal`;

const FAKE_FS: Record<string, string> = {
  'readme.txt': 'Welcome to PyOS v1.0 Aether.\nThis is a simulated filesystem.',
  'manifest.json': '{\n  "os": "PyOS",\n  "version": "1.0",\n  "codename": "Aether"\n}',
  'notes.md': '# Quick Notes\n- Organic Cyber-Glass UI\n- Modular app system\n- Theme engine',
};

const APP_LIST = [
  'terminal     — Console emulator',
  'marketentropy — Chaos visualization',
  'files        — File explorer',
  'editor       — Text editor',
  'monitor      — System monitor',
  'settings     — OS settings & themes',
];

export default function Terminal({ windowId: _windowId }: AppProps) {
  void _windowId;
  const [lines, setLines] = useState<Line[]>([
    { type: 'system', text: 'PyOS Terminal v1.0 — Type "help" for commands.' },
    { type: 'system', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const runCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    const newLines: Line[] = [...lines, { type: 'input', text: trimmed }];

    if (!trimmed) {
      setLines(newLines);
      return;
    }

    const [cmdName, ...args] = trimmed.split(/\s+/);
    const arg = args.join(' ');

    const out = (text: string, type: Line['type'] = 'output') => {
      newLines.push({ type, text });
    };

    switch (cmdName.toLowerCase()) {
      case 'help':
        out(HELP_TEXT);
        break;
      case 'echo':
        out(arg);
        break;
      case 'ls':
        out(Object.keys(FAKE_FS).join('   '));
        break;
      case 'cat':
        if (FAKE_FS[arg]) out(FAKE_FS[arg]);
        else out(`cat: ${arg || 'missing file'}: No such file`, 'error');
        break;
      case 'date':
        out(new Date().toString());
        break;
      case 'whoami':
        out('pyos-user');
        break;
      case 'neofetch':
        out(`       ___          pyos-user@pyos
      /   \\         -----------------
     |  Py |        OS: PyOS v1.0 "Aether"
      \\___/         Kernel: Aether-core 1.0
       |            Shell: pysh 1.0
      /|\\           DE: Organic Cyber-Glass
     / | \\          Theme: ${getComputedStyle(document.documentElement).getPropertyValue('--pyos-accent').trim() || '#00ff9d'}
    /  |  \\          Resolution: ${window.innerWidth}x${window.innerHeight}`);
        break;
      case 'apps':
        out(APP_LIST.join('\n'));
        break;
      case 'theme':
        out(`Current accent: ${getComputedStyle(document.documentElement).getPropertyValue('--pyos-accent').trim()}`);
        out(`Current background: ${getComputedStyle(document.documentElement).getPropertyValue('--pyos-bg').trim()}`);
        break;
      case 'about':
        out('PyOS v1.0 "Aether"\nA self-contained graphical desktop environment.\nBuilt with the Organic Cyber-Glass design language.');
        break;
      case 'clear':
        setLines([]);
        return;
      case 'exit':
        out('Use the window close button to exit.', 'system');
        break;
      default:
        out(`pysh: command not found: ${cmdName}`, 'error');
    }

    setLines(newLines);
  }, [lines]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input);
      if (input.trim()) setHistory((h) => [...h, input]);
      setInput('');
      setHistIdx(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx !== -1 && histIdx < history.length - 1) {
        const idx = histIdx + 1;
        setHistIdx(idx);
        setInput(history[idx]);
      } else {
        setHistIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col font-mono text-sm p-3 overflow-hidden"
      style={{ background: 'rgba(7,6,26,0.6)' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-0.5">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all leading-relaxed">
            {line.type === 'input' ? (
              <span>
                <span style={{ color: 'var(--pyos-accent)' }}>pyos@user</span>
                <span style={{ color: 'var(--pyos-text-dim)' }}> ~ $ </span>
                <span style={{ color: 'var(--pyos-text)' }}>{line.text}</span>
              </span>
            ) : line.type === 'error' ? (
              <span style={{ color: '#ff5577' }}>{line.text}</span>
            ) : line.type === 'system' ? (
              <span style={{ color: 'var(--pyos-text-dim)' }}>{line.text}</span>
            ) : (
              <span style={{ color: 'var(--pyos-text)' }}>{line.text}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-1 pt-1">
        <span style={{ color: 'var(--pyos-accent)' }}>pyos@user</span>
        <span style={{ color: 'var(--pyos-text-dim)' }}> ~ $</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          className="flex-1 bg-transparent outline-none ml-1"
          style={{ color: 'var(--pyos-text)', caretColor: 'var(--pyos-accent)' }}
        />
      </div>
    </div>
  );
}
