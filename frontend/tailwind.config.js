/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{ts,tsx}',
        './src/components/**/*.{ts,tsx}',
        './src/app/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                hub: {
                    bg: '#000000',      /* OLED Black */
                    surface: '#0A0A0C', /* Deep Charcoal */
                    card: '#111114',
                    accent: '#ffffff',  /* Pure white accent (Vercel style) */
                    text: '#EDEDED',
                    muted: '#8A8F98',
                    border: 'rgba(255, 255, 255, 0.08)',
                    success: '#16A34A',
                    warning: '#D97706',
                    error: '#DC2626',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            boxShadow: {
                card: '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)',
            },
            borderRadius: {
                card: '8px',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
            },
        },
    },
    plugins: [],
};
