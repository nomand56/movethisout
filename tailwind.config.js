/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* RGB triplets — supports bg-accent/90, text-ink-muted/60, etc. */
        ink: 'rgb(var(--theme-ink-rgb, 26 26 26) / <alpha-value>)',
        'ink-muted': 'rgb(var(--theme-ink-muted-rgb, 107 114 128) / <alpha-value>)',
        surface: '#FFFFFF',
        'surface-muted': 'rgb(var(--theme-surface-muted-rgb, 245 245 247) / <alpha-value>)',
        border: '#E5E7EB',
        accent: 'rgb(var(--theme-accent-rgb, 232 93 4) / <alpha-value>)',
        'accent-hover': 'rgb(var(--theme-accent-hover-rgb, 212 83 3) / <alpha-value>)',
        'accent-soft': 'rgb(var(--theme-accent-soft-rgb, 255 244 237) / <alpha-value>)',
        mover: 'rgb(var(--theme-mover-rgb, 30 41 59) / <alpha-value>)',
        header: 'rgb(var(--theme-header-rgb, 26 26 26) / <alpha-value>)',
        haul: 'rgb(var(--theme-accent-rgb, 232 93 4) / <alpha-value>)',
        'haul-hot': 'rgb(var(--theme-accent-hover-rgb, 212 83 3) / <alpha-value>)',
        jet: 'rgb(var(--theme-ink-rgb, 26 26 26) / <alpha-value>)',
        caution: '#FFC400',
        concrete: 'rgb(var(--theme-surface-muted-rgb, 245 245 247) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--theme-accent-rgb, 232 93 4) / <alpha-value>)',
          500: 'rgb(var(--theme-accent-rgb, 232 93 4) / <alpha-value>)',
          600: 'rgb(var(--theme-accent-hover-rgb, 212 83 3) / <alpha-value>)',
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
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(-2deg)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 3.5s ease-in-out infinite',
        'float-slow': 'float-slow 5s ease-in-out infinite',
        'fade-up': 'fade-up 0.7s ease-out forwards',
        shimmer: 'shimmer 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}
