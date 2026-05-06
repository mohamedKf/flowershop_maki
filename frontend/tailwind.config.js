/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1320px',
      },
    },
    extend: {
      colors: {
        // Cinematic Маки palette
        bg: {
          base: '#000000',
          stage1: '#2a0408',
          stage2: '#0a0203',
          card: '#0d0405',
          elevated: '#181010',
        },
        ink: {
          primary: '#ffffff',
          secondary: 'rgba(246, 233, 235, 0.85)',
          body: 'rgba(246, 233, 235, 0.7)',
          muted: 'rgba(246, 233, 235, 0.55)',
          faint: 'rgba(246, 233, 235, 0.4)',
        },
        red: {
          DEFAULT: '#c8102e',
          bright: '#e63946',
          deep: '#8b0000',
          shadow: '#3a0008',
          dark: '#6b0810',
        },
        rule: {
          DEFAULT: 'rgba(246, 233, 235, 0.08)',
          strong: 'rgba(246, 233, 235, 0.18)',
        },
        // Aliases for shadcn compatibility
        background: '#000000',
        foreground: '#ffffff',
        primary: {
          DEFAULT: '#c8102e',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#181010',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#181010',
          foreground: 'rgba(246, 233, 235, 0.55)',
        },
        accent: {
          DEFAULT: '#181010',
          foreground: '#c8102e',
        },
        destructive: {
          DEFAULT: '#c8102e',
          foreground: '#ffffff',
        },
        border: 'rgba(246, 233, 235, 0.08)',
        input: 'rgba(246, 233, 235, 0.18)',
        ring: '#c8102e',
        card: {
          DEFAULT: '#0d0405',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        script: ['"Pinyon Script"', 'cursive'],
      },
      letterSpacing: {
        widest: '0.4em',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.8s ease-out backwards',
        'slide-up': 'slideUp 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
