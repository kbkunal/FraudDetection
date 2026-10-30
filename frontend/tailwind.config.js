/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EAF1FC',
          100: '#C8DAEF',
          200: '#A6C3E3',
          300: '#84ACD6',
          400: '#6295CA',
          500: '#1457C5',
          600: '#0D3475',
          700: '#0A2860',
          800: '#071D4A',
          900: '#041235',
        },
        neutral: {
          50:  '#F4F6F9',
          100: '#DCE1E8',
          200: '#BDC5D0',
          300: '#9EA9B8',
          400: '#8791A0',
          500: '#657184',
          600: '#4A5568',
          700: '#374151',
          800: '#1F2937',
          900: '#17202B',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.25rem' }],
        'base':['1rem',     { lineHeight: '1.5rem' }],
        'lg':  ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      }
    },
  },
  plugins: [],
}
