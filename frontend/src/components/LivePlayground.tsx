'use client';

import React, { useState } from 'react';
import {
    SandpackProvider,
    SandpackCodeEditor,
    SandpackPreview,
    useSandpack
} from '@codesandbox/sandpack-react';
// react-resizable-panels removed — using native CSS flex split for stability
import { Monitor, Smartphone, Tablet, Moon, Sun } from 'lucide-react';
import type { Component, SandpackTemplate } from '@/types';

interface LivePlaygroundProps {
    component: Component;
}

const SANDPACK_THEME = {
    colors: {
        surface1: '#000000',
        surface2: '#0A0A0C',
        surface3: '#111114',
        clickable: '#8A8F98',
        base: '#EDEDED',
        disabled: '#333333',
        hover: '#FFFFFF',
        accent: '#FFFFFF',
        error: '#DC2626',
        errorSurface: '#2A0A0A',
    },
    syntax: {
        plain: '#EDEDED',
        comment: { color: '#8A8F98', fontStyle: 'italic' as const },
        keyword: '#FF0080',
        tag: '#0070F3',
        punctuation: '#8A8F98',
        definition: '#79FFE1',
        property: '#F81CE5',
        static: '#F5A623',
        string: '#50E3C2',
    },
    font: {
        body: "'Inter', sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
        size: '13px',
        lineHeight: '20px',
    },
};

// ─── Sandpack Internal Environment Configurations ──────────────

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const STYLES_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Inter', system-ui, sans-serif;
}

#root {
  height: 100%;
}
`;


// ─── Custom Preview Toolbar ─────────────────────────────────────

function PreviewToolbar({
    viewport,
    setViewport,
    isDark,
    setIsDark
}: {
    viewport: 'desktop' | 'tablet' | 'mobile';
    setViewport: (v: 'desktop' | 'tablet' | 'mobile') => void;
    isDark: boolean;
    setIsDark: (d: boolean) => void;
}) {
    const { sandpack } = useSandpack();
    const { status } = sandpack;

    return (
        <div className="flex flex-wrap items-center justify-between px-4 h-12 bg-hub-bg border-b border-hub-border z-10 shrink-0">
            <div className="flex items-center gap-1.5 bg-hub-surface rounded-md p-1 border border-hub-border">
                <button
                    onClick={() => setViewport('desktop')}
                    className={`p-1.5 rounded-sm transition-colors ${viewport === 'desktop' ? 'bg-white/10 text-white' : 'text-hub-muted hover:text-white'}`}
                    title="Desktop"
                >
                    <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => setViewport('tablet')}
                    className={`p-1.5 rounded-sm transition-colors ${viewport === 'tablet' ? 'bg-white/10 text-white' : 'text-hub-muted hover:text-white'}`}
                    title="Tablet"
                >
                    <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => setViewport('mobile')}
                    className={`p-1.5 rounded-sm transition-colors ${viewport === 'mobile' ? 'bg-white/10 text-white' : 'text-hub-muted hover:text-white'}`}
                    title="Mobile"
                >
                    <Smartphone className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                {status === 'running' ? (
                    <div className="flex items-center gap-2 text-xs text-hub-muted font-mono animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                        Compiling...
                    </div>
                ) : status === 'done' || status === 'idle' ? (
                    <div className="flex items-center gap-2 text-xs text-hub-muted font-mono">
                        <span className="w-2 h-2 rounded-full bg-green-500/80" />
                        Ready
                    </div>
                ) : null}

                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-1.5 ml-2 text-hub-muted hover:text-white transition-colors border border-transparent hover:border-hub-border rounded-md"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────

// Maps each stack to the correct entry file name and Sandpack-compatible template
const STACK_CONFIG: Record<SandpackTemplate, { file: string; label: string }> = {
    'vite-react-ts': { file: '/App.tsx', label: 'React · TS' },
    'vite-react': { file: '/App.jsx', label: 'React · JS' },
    'vue': { file: '/App.vue', label: 'Vue 3' },
    'svelte': { file: '/App.svelte', label: 'Svelte' },
    'angular': { file: '/app.component.ts', label: 'Angular' },
    'static': { file: '/index.html', label: 'HTML / CSS' },
    'vanilla': { file: '/index.js', label: 'Vanilla JS' },
};

export function LivePlayground({ component }: LivePlaygroundProps) {
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isDark, setIsDark] = useState(false);

    const stack = component.stack ?? 'vite-react-ts';
    const stackConfig = STACK_CONFIG[stack] ?? STACK_CONFIG['vite-react-ts'];

    // Wrap React components so we can inject styles.css cleanly without touching their raw code
    const isReact = stack === 'vite-react-ts' || stack === 'vite-react';
    const componentFileStr = isReact ? (stack === 'vite-react-ts' ? '/Component.tsx' : '/Component.jsx') : stackConfig.file;
    const entryFileName = stackConfig.file;

    // Determine viewport width constraint
    const previewWidth = viewport === 'mobile' ? 'max-w-[375px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';

    // Parse out potential inline CSS blocks (e.g. users pasting TSX and then /* styles.css */ ...css code...)
    const { componentCode, customCss } = React.useMemo(() => {
        const raw = component.raw_code;
        const styleMarker = '/* styles.css */';
        const markerIndex = raw.indexOf(styleMarker);

        if (markerIndex !== -1) {
            return {
                componentCode: raw.substring(0, markerIndex).trim(),
                customCss: raw.substring(markerIndex + styleMarker.length).trim()
            };
        }
        return { componentCode: raw, customCss: null };
    }, [component.raw_code]);

    // Memoize files to prevent infinite Sandpack re-compilation loops
    const files = React.useMemo(() => {
        const fileMap: Record<string, any> = {
            [componentFileStr]: { code: componentCode, active: true },
            '/styles.css': {
                code: customCss ? `${STYLES_CSS}\n\n/* --- Custom Component Styles --- */\n${customCss}` : STYLES_CSS,
                // If they provided custom CSS, make the styles.css tab visible and editable
                hidden: !customCss,
                active: false
            },
            '/tailwind.config.js': { code: TAILWIND_CONFIG, hidden: true },
            '/postcss.config.js': { code: POSTCSS_CONFIG, hidden: true },
        };

        if (isReact) {
            fileMap[entryFileName] = {
                code: `import React from "react";\nimport Component from ".${componentFileStr.replace('.tsx', '').replace('.jsx', '')}";\nimport "./styles.css";\n\nexport default function App() {\n  return <Component />;\n}`,
                hidden: true
            };
        }
        return fileMap;
    }, [componentFileStr, entryFileName, componentCode, customCss, isReact]);

    // Memoize customSetup to keep reference stable
    const customSetup = React.useMemo(() => ({
        dependencies: {
            "tailwindcss": "^3.4.1",
            "postcss": "^8.4.35",
            "autoprefixer": "^10.4.18",
            "lucide-react": "^0.344.0",
            "clsx": "^2.1.0",
            "tailwind-merge": "^2.2.1"
        }
    }), []);

    return (
        <div className="rounded-xl overflow-hidden border border-hub-border shadow-card flex flex-col h-[750px] bg-hub-surface">

            {/* Universal Component Header */}
            <div className="flex items-center gap-3 px-4 h-12 shrink-0 border-b border-hub-border bg-[#0A0A0C]">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 border border-white/10" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-white/10" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 border border-white/10" />
                </div>
                <span className="text-[11px] text-white font-mono tracking-tight ml-2">
                    {component.title}{componentFileStr.replace('/Component', '').replace('/App', '').replace('/index', '') || '.tsx'}
                </span>
                <div className="ml-auto">
                    <span className="inline-block border border-hub-border bg-white/5 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {stackConfig.label}
                    </span>
                </div>
            </div>

            {/* Resizable Split-Pane Layout */}
            <div className="flex-1 overflow-hidden">
                <SandpackProvider
                    template={stack as SandpackTemplate}
                    theme={SANDPACK_THEME}
                    files={files}
                    customSetup={customSetup}
                >
                    {/* Simple CSS Flex Split: Code Editor left | Preview right */}
                    <div className="flex h-full">
                        {/* Left Pane: Code Editor */}
                        <div className="flex flex-col w-1/2 relative h-full bg-[#000000] border-r border-hub-border">
                            <div className="flex-1 min-h-0 overflow-y-auto relative custom-sandpack-wrapper">
                                <SandpackCodeEditor
                                    showLineNumbers
                                    showTabs={true}
                                    showInlineErrors
                                    wrapContent
                                />
                            </div>
                        </div>

                        {/* Right Pane: Live Preview */}
                        <div className="flex flex-col w-1/2 bg-hub-surface h-full relative">
                            <PreviewToolbar
                                viewport={viewport}
                                setViewport={setViewport}
                                isDark={isDark}
                                setIsDark={setIsDark}
                            />
                            <div className="flex-1 overflow-auto bg-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center p-4">
                                <div className={`w-full h-full bg-white shadow-2xl transition-all duration-300 rounded overflow-hidden ${previewWidth} border border-hub-border/50`}>
                                    <SandpackPreview
                                        showOpenInCodeSandbox={false}
                                        showRefreshButton={false}
                                        style={{ height: '100%', minHeight: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </SandpackProvider>
            </div>

            {/* Global Style Override for Sandpack Internals to fix overlapping borders */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-sandpack-wrapper .sp-wrapper {
            height: 100%;
            overflow: hidden;
        }
        .custom-sandpack-wrapper .sp-layout {
            border: none;
            border-radius: 0;
            height: 100%;
        }
        .custom-sandpack-wrapper .sp-code-editor {
            overflow-y: auto !important;
            height: 100% !important;
        }
        .custom-sandpack-wrapper .cm-editor {
            min-height: 100%;
            height: auto !important;
        }
        .custom-sandpack-wrapper .cm-scroller {
            overflow-y: auto !important;
        }
      `}} />
        </div>
    );
}
