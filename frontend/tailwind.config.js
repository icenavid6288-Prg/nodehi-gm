/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary, 15 42 67) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light, 27 64 102) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark, 8 26 43) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary, 18 181 165) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light, 63 207 192) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark, 11 132 120) / <alpha-value>)',
          foreground: '#04231F',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent, 255 107 53) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light, 255 138 92) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark, 224 78 27) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};
