/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#04060A',
          900: '#070A11',
          850: '#0B0F19',
          800: '#101624',
          750: '#161F33',
          700: '#1C2740',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
        accent: {
          cyan: '#06B6D4',
          violet: '#8B5CF6',
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'bezel-outer': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.7)',
        'bezel-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)',
        'glow-brand': '0 0 35px -5px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 35px -5px rgba(16, 185, 129, 0.4)',
        'glow-rose': '0 0 35px -5px rgba(244, 63, 94, 0.4)',
      },
      animation: {
        'radar-ping': 'radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'mesh-float': 'meshFloat 12s ease-in-out infinite alternate',
      },
      keyframes: {
        radarPing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '70%, 100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        meshFloat: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(20px, -20px) scale(1.05)' },
          '100%': { transform: 'translate(-15px, 15px) scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
}
