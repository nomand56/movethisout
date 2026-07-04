/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // v2 — professional palette
        ink: '#1A1A1A',
        'ink-muted': '#6B7280',
        surface: '#FFFFFF',
        'surface-muted': '#F5F5F7',
        border: '#E5E7EB',
        accent: '#E85D04',
        'accent-hover': '#D45303',
        'accent-soft': '#FFF4ED',
        mover: '#1E293B',
        // v1 legacy (migrate away)
        haul: '#E85D04',
        'haul-hot': '#D45303',
        jet: '#1A1A1A',
        caution: '#FFC400',
        concrete: '#F5F5F7',
        brand: {
          DEFAULT: '#E85D04',
          500: '#E85D04',
          600: '#D45303',
        },
      },
      fontFamily: {
        display: ['Barlow', 'Inter', 'system-ui', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'Barlow', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
        sheet: '0 -4px 24px rgba(0,0,0,0.12)',
        hard: '4px 4px 0 #141414',
        'hard-sm': '3px 3px 0 #141414',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
}
