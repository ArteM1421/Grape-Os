import { useState, useRef, useEffect } from 'react';
import { Save, FileText, Hash, Type, Bold } from 'lucide-react';
import type { AppProps } from '../os/types';

const SAMPLE = `# Welcome to PyOS Text Editor

This is a lightweight code editor with syntax highlighting.

Features:
- Line numbers
- Auto-indent
- Syntax-aware coloring
- Save indicator

def hello():
    print("Hello from PyOS!")

class Kernel:
    def __init__(self):
        self.version = "1.0"
        self.codename = "Aether"
`;

export default function Editor({ windowId: _windowId }: AppProps) {
  void _windowId;
  const [content, setContent] = useState(SAMPLE);
  const [saved, setSaved] = useState(true);
  const [showLineNums, setShowLineNums] = useState(true);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const lines = content.split('\n');

  const highlight = (text: string): string => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments
    html = html.replace(/(#[^\n]*)/g, '<span style="color:#5a6a7a">$1</span>');
    // Strings
    html = html.replace(/("[^"]*"|'[^']*')/g, '<span style="color:#ffd166">$1</span>');
    // Keywords
    html = html.replace(
      /\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|pass|lambda|None|True|False|self|print)\b/g,
      '<span style="color:#00ff9d;font-weight:500">$1</span>'
    );
    // Numbers
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#00d4ff">$1</span>');
    // Functions
    html = html.replace(/(\bdef\s+)(\w+)/g, '$1<span style="color:#ff7a59">$2</span>');

    return html;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.substring(0, start) + '    ' + content.substring(end);
      setContent(newContent);
      setSaved(false);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
    if (e.key === 'Enter') {
      // Auto-indent
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const currentLine = content.substring(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[0] ?? '';
      const extraIndent = currentLine.trimEnd().endsWith(':') ? '    ' : '';
      if (indent || extraIndent) {
        e.preventDefault();
        const newContent = content.substring(0, start) + '\n' + indent + extraIndent + content.substring(ta.selectionEnd);
        setContent(newContent);
        setSaved(false);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1 + indent.length + extraIndent.length;
        });
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const syncScroll = () => {
    if (taRef.current && preRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    syncScroll();
  }, [content]);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgba(7,6,26,0.5)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <FileText size={14} style={{ color: 'var(--pyos-accent)' }} />
        <span className="text-xs font-mono">untitled.py</span>
        {!saved && <span className="text-[10px] text-[var(--pyos-text-dim)]">— modified</span>}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowLineNums((v) => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              showLineNums ? 'bg-white/8' : 'hover:bg-white/5'
            }`}
            title="Toggle line numbers"
          >
            <Hash size={13} />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg accent-gradient text-black/80 text-xs font-medium hover:scale-105 transition-transform"
          >
            <Save size={12} />
            Save
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-sm">
        {showLineNums && (
          <div className="flex-shrink-0 py-3 px-2 text-right text-[var(--pyos-text-dim)] text-xs select-none overflow-hidden">
            {lines.map((_, i) => (
              <div key={i} style={{ lineHeight: '1.6' }}>
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 relative overflow-hidden">
          <pre
            ref={preRef}
            aria-hidden
            className="absolute inset-0 p-3 overflow-auto pointer-events-none whitespace-pre"
            style={{ color: 'var(--pyos-text)', lineHeight: '1.6' }}
          >
            <code dangerouslySetInnerHTML={{ __html: highlight(content) + '\n' }} />
          </pre>
          <textarea
            ref={taRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            className="absolute inset-0 p-3 bg-transparent outline-none resize-none whitespace-pre overflow-auto"
            style={{
              color: 'transparent',
              caretColor: 'var(--pyos-accent)',
              lineHeight: '1.6',
              WebkitTextFillColor: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/10 text-[10px] font-mono text-[var(--pyos-text-dim)]">
        <span className="flex items-center gap-1">
          <Type size={10} /> {content.length} chars
        </span>
        <span>{lines.length} lines</span>
        <span>Python</span>
        <span className="ml-auto">{saved ? 'Saved' : 'Unsaved changes'}</span>
      </div>
    </div>
  );
}
