/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['"Traditional Arabic"', '"Amiri"', 'serif'],
      },
      colors: {
        quran: {
          primary: '#2c3e50',
          secondary: '#34495e',
          highlight: '#41b883',
          light: '#f8f9fa',
          dark: '#1a1a1a',
        },
      },
    },
  },
  darkMode: 'class', // or 'media' for system preference
  plugins: [],
}
