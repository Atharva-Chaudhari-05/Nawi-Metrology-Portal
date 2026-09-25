/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F8F6',
        surface: '#FFFFFF',
        primary: '#1F5F5B', // deep teal
        secondary: '#B8860B', // muted brass/gold
        success: '#2E7D4F',
        fail: '#B3402A',
        textPrimary: '#1C1F1E',
        textSecondary: '#5B615E',
        border: '#E4E7E2',
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans"', 'sans-serif'],
        serif: ['"Fraunces"', '"Source Serif 4"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
      }
    },
  },
  plugins: [],
}
