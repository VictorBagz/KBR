/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        rugby: {
          950: '#0f172a',
          900: '#1e293b',
          800: '#334155',
          700: '#475569',
          accent: '#3b82f6',
          muted: '#64748b',
        }
      }
    }
  },
  plugins: [],
}
