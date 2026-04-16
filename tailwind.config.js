/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:       '#0d0d1a',
          darker:     '#070710',
          navy:       '#1a1a2e',
          cyan:       '#22d3ee',
          'cyan-dim': '#0891b2',
          'cyan-glow':'#67e8f9',
          'cyan-pale':'#cffafe',
        }
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'cyan-sm': '0 0 12px rgba(34,211,238,0.2)',
        'cyan-md': '0 0 28px rgba(34,211,238,0.35)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease forwards',
        'slide-up':  'slideUp 0.4s ease forwards',
        'pulse-slow':'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:'translateY(16px)' }, to:{ opacity:1, transform:'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
