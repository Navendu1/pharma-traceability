/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1B365D',
          ocean: '#2E6B9E',
          teal: '#0E5A44',
          slate: '#4A607A',
          cream: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}

