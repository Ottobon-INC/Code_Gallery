import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { LivePlayground } from '@/components/LivePlayground';

interface Props {
    params: { id: string };
}

const STACK_LABELS: Record<string, string> = {
    'vite-react-ts': 'React · TS',
    'vite-react': 'React · JS',
    'vue': 'Vue 3',
    'svelte': 'Svelte',
    'angular': 'Angular',
    'static': 'HTML / CSS',
    'vanilla': 'Vanilla JS',
};

export default async function ComponentPage({ params }: Props) {
    let component;
    try { component = await api.components.get(params.id); }
    catch { notFound(); }

    const stackLabel = STACK_LABELS[component.stack] ?? component.stack;

    return (
        <div className="p-10 max-w-[1400px]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-hub-muted mb-8 font-medium">
                <a href="/" className="hover:text-white transition-colors">Components</a>
                <span className="opacity-50">/</span>
                <span className="text-white">{component.title}</span>
            </div>

            {/* Component header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">{component.title}</h1>
                    <p className="text-hub-muted text-sm mt-2 max-w-2xl leading-relaxed">{component.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                        {/* Author */}
                        <span className="inline-flex items-center gap-1.5 text-xs text-hub-muted">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            {component.author_name ?? 'Unknown'}
                        </span>
                        {/* Likes */}
                        <span className="inline-flex items-center gap-1.5 text-xs text-hub-muted">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                            {component.likes} likes
                        </span>
                        {/* Category */}
                        {component.category && component.category !== 'uncategorized' && (
                            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
                                {component.category.replace('-', ' ')}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="border border-hub-border bg-white/5 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {stackLabel}
                    </div>
                </div>
            </div>

            {/* Live Playground */}
            <LivePlayground component={component} />

            {/* CLI injection tip */}
            <div className="mt-8 card p-5 flex items-center justify-between gap-4 border-l-2 border-l-white bg-gradient-to-r from-white/5 to-transparent">
                <div>
                    <p className="text-white text-sm font-semibold">Integrate component locally</p>
                    <p className="text-hub-muted text-xs mt-1">Run this command in your project root to auto-inject the `.tsx` file.</p>
                </div>
                <div className="flex items-center gap-3">
                    <code className="font-mono text-[13px] bg-black px-4 py-2.5 rounded-md border border-hub-border text-white">
                        <span className="text-hub-muted select-none mr-2">$</span>
                        ottobon-hub add {component.title.replace(/\s+/g, '-').toLowerCase()}
                    </code>
                </div>
            </div>
        </div>
    );
}
