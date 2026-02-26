import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae7ff',
          200: '#bdd4ff',
          300: '#8cb4ff',
          400: '#5a90ff',
          500: '#2f74ff',
          600: '#1769ff',
          700: '#0b4fd8',
          800: '#0d41aa',
          900: '#123a89'
        },
        ink: {
          50: '#f3f5f8',
          100: '#e5eaf1',
          200: '#cfd8e4',
          300: '#aebdd0',
          400: '#879cb6',
          500: '#687f9b',
          600: '#516478',
          700: '#3b4a59',
          800: '#27323f',
          900: '#111822'
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)']
      },
      boxShadow: {
        soft: '0 14px 30px -18px rgba(15, 23, 42, 0.35)',
        panel: '0 28px 55px -30px rgba(23, 105, 255, 0.3)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
};

export default config;
