/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'small': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'caption': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.04em', fontWeight: '500' }],
      },
      colors: {
        border: "var(--border-default)",
        input: "var(--border-default)",
        ring: "var(--accent-primary)",
        background: "var(--bg-base)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--accent-primary)",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "var(--bg-elevated-2)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--bg-elevated-2)",
          foreground: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--bg-elevated-2)",
          foreground: "var(--text-primary)",
          primary: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
        },
        popover: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)",
        },
        card: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)",
        },
        success: {
          DEFAULT: "var(--success)",
          muted: "var(--success-muted)",
        },
        error: {
          DEFAULT: "var(--error)",
          muted: "var(--error-muted)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          muted: "var(--warning-muted)",
        },
        info: {
          DEFAULT: "var(--info)",
          muted: "var(--info-muted)",
        },
      },
      backgroundColor: {
        base: "var(--bg-base)",
        elevated: "var(--bg-elevated)",
        "elevated-2": "var(--bg-elevated-2)",
        "elevated-3": "var(--bg-elevated-3)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        disabled: "var(--text-disabled)",
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        default: "var(--border-default)",
        strong: "var(--border-strong)",
        accent: "var(--border-accent)",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
