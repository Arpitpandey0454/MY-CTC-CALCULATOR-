/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      colors: {
        primary: '#3b82f6',
        accent: '#8b5cf6',
        gray: { 800: '#1f2937', 900: '#111827', 950: '#030712' }
      }
    },
  },
  plugins: [],
}
