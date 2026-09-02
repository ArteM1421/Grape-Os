import { useState, useEffect, useMemo } from 'react';

interface SourceFile {
  path: string;
  content: string;
}

const HEADER = `# VinGrape OS — Official Source Documentation
# ============================================
# This is an official document of the VinGrape OS platform.
# It contains the full source code of all OS files so that
# external AI systems can read and understand the system,
# and create compatible applications.
#
# APP CREATION IS ALLOWED AND ENCOURAGED.
# Any AI or developer may use this document to build apps
# that run on VinGrape OS. This is an official document.
#
# HOW APPS WORK:
# 1. An app is a React component exported as default from a .tsx file.
# 2. Apps receive props: { windowId: string, osApi?: OSApi }
# 3. Apps are transpiled and executed at runtime using Babel Standalone.
#    The runtime supports React hooks, JSX/TSX, Tailwind CSS classes,
#    and lucide-react icons. No build step is needed — the app runs
#    immediately after being saved to the custom_apps table.
# 4. Available imports in app code:
#    - "react" (useState, useEffect, useRef, useCallback, useMemo, etc.)
#    - "lucide-react" (all icons)
#    The osApi object (when granted permissions) provides:
#    - osApi.windows.open(appId), .close(windowId), .minimize(windowId),
#      .focus(windowId), .list(), .setTitle(windowId, title)
#    - osApi.theme.get(), .set(themeId), .list()
#    - osApi.settings.get(key), .set(key, value), .remove(key)
#    - osApi.apps.list(), .open(appId)
#    - osApi.storage.get(key), .set(key, value), .remove(key)
# 5. Apps can declare permissions via a manifest.json with a "permissions" array.
#    Valid permissions:
#    - "system:settings" — read/modify OS settings
#    - "system:files" — create/modify/delete system files and shortcuts
#    - "system:windows" — manage other application windows
#    - "system:themes" — change desktop theme and appearance
#    - "system:shortcuts" — add/remove/rearrange desktop icons
#    - "system:boot" — modify boot config, BIOS, and recovery
# 6. Apps with permissions show a security warning before launching.
# 7. Apps can also access osApi via the props passed to the component.
#
# APP INSTALLATION:
# Apps can be installed via Vin Market (direct download or beta),
# or created with Code Studio, or added by AI through the custom_apps table.
# The custom_apps table columns: app_id, name, description, icon_name, code, permissions
#
# ============================================
`;

export default function TextView() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const collected: SourceFile[] = [];

      const modules = import.meta.glob('/src/**/*.{ts,tsx,css}', { as: 'raw' });

      const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b));

      for (const [path, loader] of entries) {
        try {
          const content = (await loader()) as string;
          collected.push({ path: path.replace('/src/', ''), content });
        } catch {
          // skip failed loads
        }
      }

      setFiles(collected);
      setLoading(false);
    })();
  }, []);

  const fullText = useMemo(() => {
    let text = HEADER;
    for (const file of files) {
      text += `\n# ============================================\n# FILE: ${file.path}\n# ============================================\n\n`;
      text += file.content;
      text += '\n\n';
    }
    return text;
  }, [files]);

  if (loading) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', padding: '20px', fontFamily: 'monospace', fontSize: '12px', color: '#999' }}>
        Loading OS source files...
      </pre>
    );
  }

  return (
    <pre
      style={{
        whiteSpace: 'pre-wrap',
        padding: '20px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ccc',
        background: '#0a0a0c',
        margin: 0,
        wordBreak: 'break-all',
      }}
    >
      {fullText}
    </pre>
  );
}
