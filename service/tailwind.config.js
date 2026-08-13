/** @type {import('tailwindcss').Config} */
export default {
  content: ['./frontend/index.html', './frontend/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f1d33',
          800: '#1b2a4a',
          700: '#243660',
          600: '#2e4275',
        },
        toyota: '#EB0A1E',
        lexus: '#2563EB',
      },
    },
  },
  plugins: [],
}
