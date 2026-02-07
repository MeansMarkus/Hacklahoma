/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          deep: '#0f172a',
          mid: '#1e293b',
          light: '#334155',
        },
        mountain: {
          dark: '#1e293b',
          mid: '#334155',
          light: '#475569',
        },
        gold: {
          DEFAULT: '#fbbf24',
          dim: '#d97706',
        },
        accent: '#38bdf8',
        success: '#34d399',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
