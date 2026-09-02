import { useState, useEffect, useCallback } from 'react';
import { Code2, FolderPlus, Play, Trash2, FileText, Folder, ChevronRight, Plus, Save, Loader2, Check, AlertCircle, Image as ImageIcon, FileJson } from 'lucide-react';
import type { AppProps } from '../os/types';
import { addCustomApp } from '../os/runtimeRegistry';

interface ProjectFile {
  name: string;
  type: 'tsx' | 'json' | 'image';
  content: string;
}

interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: number;
}

const STORAGE_KEY = 'codestudio-projects';

function loadProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

const DEFAULT_TSX = `export default function App() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #1a0f3a)' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#00ff9d' }}>Hello World!</h1>
        <p className="text-sm mt-2" style={{ color: '#9a96b8' }}>My first VinGrape app</p>
      </div>
    </div>
  );
}
`;

const DEFAULT_MANIFEST = `{
  "name": "My App",
  "description": "A custom app created with Code Studio",
  "icon": "Sparkles",
  "version": "1.0.0"
}
`;

export default function CodeStudio(_props: AppProps) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [compileMsg, setCompileMsg] = useState('');

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const currentFile = activeProject?.files.find((f) => f.name === activeFile) ?? null;

  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.content);
    } else {
      setCode('');
    }
  }, [activeFile, activeProjectId]);

  const persistProjects = useCallback((next: Project[]) => {
    setProjects(next);
    saveProjects(next);
  }, []);

  const createProject = () => {
    const id = `proj-${Date.now()}`;
    const project: Project = {
      id,
      name: `Project ${projects.length + 1}`,
      files: [
        { name: 'App.tsx', type: 'tsx', content: DEFAULT_TSX },
        { name: 'manifest.json', type: 'json', content: DEFAULT_MANIFEST },
      ],
      createdAt: Date.now(),
    };
    persistProjects([...projects, project]);
    setActiveProjectId(id);
    setActiveFile('App.tsx');
    setCompileResult('idle');
  };

  const deleteProject = (pid: string) => {
    persistProjects(projects.filter((p) => p.id !== pid));
    if (activeProjectId === pid) {
      setActiveProjectId(null);
      setActiveFile(null);
    }
  };

  const addFile = (type: ProjectFile['type']) => {
    if (!activeProject) return;
    const ext = type === 'tsx' ? 'tsx' : type === 'json' ? 'json' : 'png';
    let name = `file-${Date.now()}.${ext}`;
    if (type === 'json') name = 'manifest.json';
    if (type === 'tsx') name = `Component${activeProject.files.length}.${ext}`;
    const newFile: ProjectFile = {
      name,
      type,
      content: type === 'image' ? '' : type === 'json' ? DEFAULT_MANIFEST : DEFAULT_TSX,
    };
    const updated = projects.map((p) =>
      p.id === activeProject.id ? { ...p, files: [...p.files, newFile] } : p
    );
    persistProjects(updated);
    setActiveFile(name);
  };

  const saveFile = () => {
    if (!activeProject || !activeFile) return;
    const updated = projects.map((p) =>
      p.id === activeProject.id
        ? { ...p, files: p.files.map((f) => (f.name === activeFile ? { ...f, content: code } : f)) }
        : p
    );
    persistProjects(updated);
  };

  const compile = async () => {
    if (!activeProject) return;
    setCompiling(true);
    setCompileResult('idle');
    setCompileMsg('');

    await new Promise((r) => setTimeout(r, 800));

    const tsxFile = activeProject.files.find((f) => f.type === 'tsx');
    const manifestFile = activeProject.files.find((f) => f.type === 'json');

    if (!tsxFile) {
      setCompileResult('error');
      setCompileMsg('No App.tsx file found in project.');
      setCompiling(false);
      return;
    }

    let manifest: { name?: string; description?: string; icon?: string } = {};
    if (manifestFile) {
      try {
        manifest = JSON.parse(manifestFile.content);
      } catch {
        setCompileResult('error');
        setCompileMsg('manifest.json has invalid JSON.');
        setCompiling(false);
        return;
      }
    }

    try {
      await addCustomApp({
        id: `studio-${activeProject.id}`,
        name: manifest.name ?? activeProject.name,
        description: manifest.description ?? 'Created with Code Studio',
        icon: manifest.icon ?? 'Code2',
        code: tsxFile.content,
      });
      window.dispatchEvent(new Event('vingrape-settings-change'));
      setCompileResult('success');
      setCompileMsg(`"${manifest.name ?? activeProject.name}" is now on your desktop!`);
    } catch (e) {
      setCompileResult('error');
      setCompileMsg(e instanceof Error ? e.message : 'Compilation failed');
    }
    setCompiling(false);
  };

  const renameProject = (pid: string, name: string) => {
    persistProjects(projects.map((p) => (p.id === pid ? { ...p, name } : p)));
  };

  return (
    <div className="w-full h-full flex" style={{ background: 'rgba(7,6,26,0.4)' }}>
      {/* Sidebar: project list */}
      <div className="w-52 flex-shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10">
          <button
            onClick={createProject}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg accent-gradient text-black/80 text-xs font-medium hover:scale-[1.02] transition-transform"
          >
            <FolderPlus size={14} /> New Project
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {projects.length === 0 && (
            <p className="text-[10px] text-center py-8" style={{ color: 'var(--pyos-text-dim)' }}>
              No projects yet. Create one to start coding.
            </p>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className={`group rounded-lg p-2 mb-1 cursor-pointer transition-colors ${
                activeProjectId === p.id ? 'bg-white/8' : 'hover:bg-white/5'
              }`}
              onClick={() => { setActiveProjectId(p.id); setActiveFile(p.files[0]?.name ?? null); setCompileResult('idle'); }}
            >
              <div className="flex items-center gap-2">
                <Folder size={13} style={{ color: activeProjectId === p.id ? 'var(--pyos-accent)' : 'var(--pyos-text-dim)' }} />
                <input
                  value={p.name}
                  onChange={(e) => renameProject(p.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-xs outline-none min-w-0"
                  style={{ color: 'var(--pyos-text)' }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} style={{ color: 'var(--pyos-error)' }} />
                </button>
              </div>
              <p className="text-[9px] ml-5 mt-0.5" style={{ color: 'var(--pyos-text-dim)' }}>
                {p.files.length} files
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* File explorer */}
      {activeProject && (
        <div className="w-44 flex-shrink-0 border-r border-white/10 flex flex-col">
          <div className="p-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--pyos-text-dim)' }}>Files</span>
            <div className="flex gap-1">
              <button onClick={() => addFile('tsx')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/8" title="Add TSX">
                <Plus size={11} style={{ color: 'var(--pyos-accent)' }} />
              </button>
              <button onClick={() => addFile('json')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/8" title="Add JSON">
                <FileJson size={11} style={{ color: 'var(--pyos-accent-2)' }} />
              </button>
              <button onClick={() => addFile('image')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/8" title="Add Image">
                <ImageIcon size={11} style={{ color: 'var(--pyos-text-dim)' }} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {activeProject.files.map((f) => (
              <button
                key={f.name}
                onClick={() => setActiveFile(f.name)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                  activeFile === f.name ? 'bg-white/8' : 'hover:bg-white/5'
                }`}
              >
                {f.type === 'tsx' ? <FileText size={12} style={{ color: 'var(--pyos-accent)' }} /> :
                 f.type === 'json' ? <FileJson size={12} style={{ color: 'var(--pyos-accent-2)' }} /> :
                 <ImageIcon size={12} style={{ color: 'var(--pyos-text-dim)' }} />}
                <span className="truncate" style={{ color: 'var(--pyos-text)' }}>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeProject && currentFile ? (
          <>
            <div className="flex items-center gap-2 p-3 border-b border-white/10">
              <ChevronRight size={13} style={{ color: 'var(--pyos-text-dim)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--pyos-text-dim)' }}>{currentFile.name}</span>
              <div className="flex-1" />
              <button
                onClick={saveFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-xs transition-colors"
              >
                <Save size={12} style={{ color: 'var(--pyos-text-dim)' }} /> Save
              </button>
              <button
                onClick={compile}
                disabled={compiling}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg accent-gradient text-black/80 text-xs font-medium hover:scale-[1.03] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {compiling ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                Compile
              </button>
            </div>

            {compileResult !== 'idle' && (
              <div
                className="mx-3 mt-3 p-3 rounded-lg flex items-center gap-2 text-xs"
                style={{
                  background: compileResult === 'success' ? 'rgba(0,255,157,0.1)' : 'rgba(255,85,119,0.1)',
                  color: compileResult === 'success' ? 'var(--pyos-success)' : 'var(--pyos-error)',
                }}
              >
                {compileResult === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                {compileMsg}
              </div>
            )}

            {currentFile.type === 'image' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <ImageIcon size={48} className="mb-4 opacity-30" style={{ color: 'var(--pyos-text-dim)' }} />
                <p className="text-xs" style={{ color: 'var(--pyos-text-dim)' }}>
                  Image files are stored as project assets. They'll be included when you compile.
                </p>
                <p className="text-[10px] mt-2 font-mono" style={{ color: 'var(--pyos-text-dim)' }}>{currentFile.name}</p>
              </div>
            ) : (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full p-4 bg-black/20 font-mono text-xs outline-none resize-none"
                style={{ color: 'var(--pyos-text)', tabSize: 2 }}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Code2 size={48} className="mb-4 opacity-20" style={{ color: 'var(--pyos-text-dim)' }} />
            <h3 className="text-sm font-medium mb-1">Code Studio</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--pyos-text-dim)' }}>
              Create a project, write code, and compile it to your desktop.
            </p>
            <button
              onClick={createProject}
              className="flex items-center gap-2 px-4 py-2 rounded-lg accent-gradient text-black/80 text-xs font-medium hover:scale-105 transition-transform"
            >
              <FolderPlus size={14} /> Create New Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
