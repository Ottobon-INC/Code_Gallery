'use client';

import React from 'react';
import {
    SandpackProvider,
    SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
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
    const stack = component.stack ?? 'vite-react-ts';
    const stackConfig = STACK_CONFIG[stack] ?? STACK_CONFIG['vite-react-ts'];

    // Wrap React components so we can inject styles.css cleanly without touching their raw code
    const isReact = stack === 'vite-react-ts' || stack === 'vite-react';
    const componentFileStr = isReact ? (stack === 'vite-react-ts' ? '/Component.tsx' : '/Component.jsx') : stackConfig.file;
    const entryFileName = stackConfig.file;

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
        <div className="rounded-xl overflow-hidden border border-hub-border shadow-card flex flex-col bg-hub-surface">

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

            {/* Full-Width Code Editor */}
            <div className="overflow-hidden">
                <SandpackProvider
                    template={stack as SandpackTemplate}
                    theme={SANDPACK_THEME}
                    files={files}
                    customSetup={customSetup}
                >
                    <div className="custom-sandpack-wrapper">
                        <SandpackCodeEditor
                            showLineNumbers
                            showTabs={true}
                            showInlineErrors
                            wrapContent
                        />
                    </div>
                </SandpackProvider>
            </div>

            {/* Global Style Override for Sandpack Internals */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-sandpack-wrapper .sp-wrapper {
            height: auto;
        }
        .custom-sandpack-wrapper .sp-layout {
            border: none;
            border-radius: 0;
            height: auto;
        }
        .custom-sandpack-wrapper .sp-code-editor {
            overflow-y: auto !important;
            min-height: 400px;
        }
        .custom-sandpack-wrapper .cm-editor {
            min-height: 400px;
            height: auto !important;
        }
        .custom-sandpack-wrapper .cm-scroller {
            overflow-y: auto !important;
        }
      `}} />
        </div>
    );
}
