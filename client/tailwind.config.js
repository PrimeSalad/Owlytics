/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Questrial', 'sans-serif'],
      },
      colors: {
        // Brand — premium emerald, clean and sharp
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // primary — vivid emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#0d1f1a', // sidebar — near-black with green tint
        },
        // Semantic surface tokens
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          subtle: '#f1f5f9',
          border: '#e2e8f0',
        },
        // Status colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          DEFAULT: '#22c55e',
          light: '#dcfce7',
          dark: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#1d4ed8',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        // Layered, soft shadows for a premium sense of depth
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 2px 5px -1px rgb(15 23 42 / 0.06)',
        'card-hover': '0 10px 28px -8px rgb(15 23 42 / 0.14), 0 4px 10px -4px rgb(15 23 42 / 0.08)',
        lift: '0 16px 40px -12px rgb(15 23 42 / 0.20)',
        modal: '0 28px 80px -16px rgb(15 23 42 / 0.38)',
        'brand-glow': '0 8px 24px -6px rgb(16 185 129 / 0.45)',
        // Combined inner highlight + soft drop for raised controls (buttons, chips)
        btn: 'inset 0 1px 0 0 rgb(255 255 255 / 0.18), 0 1px 2px 0 rgb(15 23 42 / 0.12)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      backgroundImage: {
        'card-sheen': 'linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%)',
        'grid-faint':
          'linear-gradient(to right, rgb(15 23 42 / 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.03) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up':  { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'shimmer': { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease-out both',
        'fade-up':  'fade-up 0.3s ease-out both',
        'slide-in': 'slide-in 0.25s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.32,0.72,0,1) both',
        'spin-slow': 'spin-slow 1.4s linear infinite',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer': 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
