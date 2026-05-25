import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#030712',
        ink: '#07111f',
        panel: '#0b1627',
        steel: '#86a6c9',
        frost: '#d9e8ff',
        signal: '#4f8cff',
        cobalt: '#133e7c',
        line: 'rgba(148, 185, 227, 0.14)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 70px rgba(79, 140, 255, 0.18)',
        panel: '0 24px 90px rgba(0, 0, 0, 0.45)',
      },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(28px,-22px,0) scale(1.04)' },
        },
        scan: {
          '0%': { transform: 'translateY(-15vh)' },
          '100%': { transform: 'translateY(115vh)' },
        },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        scan: 'scan 11s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
