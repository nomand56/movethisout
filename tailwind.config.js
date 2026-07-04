/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        haul: '#F25800',
        'haul-hot': '#FF6A00',
        jet: '#141414',
        caution: '#FFC400',
        concrete: '#EFEDEA',
        brand: {
          DEFAULT: '#F25800',
          500: '#F25800',
          600: '#E04F00',
        },
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Barlow', '-apple-system', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 #141414',
        'hard-sm': '3px 3px 0 #141414',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
}
