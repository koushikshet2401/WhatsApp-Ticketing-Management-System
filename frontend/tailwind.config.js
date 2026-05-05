/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f7f9f2',
          100: '#ebf6c4', // User's soft yellow green
          200: '#d9e8a3',
          300: '#c1d67a',
          400: '#a3c051',
          500: '#83a436',
          600: '#4B672D', // User's deep muted green
          700: '#3d5425',
          800: '#2f411d',
          900: '#212e15',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}