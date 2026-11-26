/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFC700',
          yellowHover: '#E6B300',
          yellowSoft: '#FFF8D6',
          ink: '#0B0B0F',
          white: '#FFFFFF',
        },
        gray: {
          50: '#F7F7F8',
          100: '#EEEEF0',
          200: '#E0E0E4',
          400: '#9A9AA5',
          600: '#5B5B66',
          900: '#17171C',
        },
        status: {
          success: '#12B76A',
          warning: '#F79009',
          danger: '#F04438',
          info: '#2E90FA',
        },
        booking: {
          requested: '#F59E0B',
          accepted: '#2E90FA',
          ontheway: '#4F46E5',
          arrived: '#7C3AED',
          inprogress: '#0D9488',
          completed: '#12B76A',
          terminated: '#F04438',
        },
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFC700',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#17171C',
          950: '#0B0B0F',
        },
        secondary: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#12B76A',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ds-12': ['12px', { lineHeight: '16px', letterSpacing: '0em' }],
        'ds-14': ['14px', { lineHeight: '20px', letterSpacing: '0em' }],
        'ds-16': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
        'ds-20': ['20px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
        'ds-24': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        'ds-32': ['32px', { lineHeight: '38px', letterSpacing: '-0.025em' }],
        'ds-40': ['40px', { lineHeight: '46px', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        card: '12px',
        input: '12px',
        sheet: '16px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 24px rgba(11, 11, 15, 0.10)',
        sheet: '0 -10px 32px rgba(11, 11, 15, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08)',
        panel: '0 20px 40px -15px rgba(11, 11, 15, 0.25)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
      keyframes: {
        sheetSlideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0.6' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        modalPop: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        stepPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 199, 0, 0.45)' },
          '50%': { boxShadow: '0 0 0 6px rgba(255, 199, 0, 0)' },
        },
      },
      animation: {
        'sheet-up': 'sheetSlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-pop': 'modalPop 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'step-pulse': 'stepPulse 1.8s infinite',
      },
    },
  },
  plugins: [],
};
