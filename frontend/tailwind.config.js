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
        // CSS-variable driven for theme switching
        bg: {
          base: 'var(--bg-base)',
          stage1: 'var(--bg-stage1)',
          stage2: 'var(--bg-stage2)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          body: 'var(--ink-body)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        red: {
          DEFAULT: 'var(--red)',
          bright: 'var(--red-bright)',
          deep: 'var(--red-deep)',
          shadow: 'var(--red-shadow)',
          dark: 'var(--red-dark)',
        },
        rule: {
          DEFAULT: 'var(--rule)',
          strong: 'var(--rule-strong)',
        },
        // shadcn aliases
        background: 'var(--bg-base)',
        foreground: 'var(--ink-primary)',
        primary: {
          DEFAULT: 'var(--red)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--ink-primary)',
        },
        muted: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--ink-muted)',
        },
        accent: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--red)',
        },
        destructive: {
          DEFAULT: 'var(--red)',
          foreground: '#ffffff',
        },
        border: 'var(--rule)',
        input: 'var(--rule-strong)',
        ring: 'var(--red)',
        card: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--ink-primary)',
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
