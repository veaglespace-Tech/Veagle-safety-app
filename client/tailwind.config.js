/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 1. PRIMARY - Porcelain Amethyst & Rich Baby Pink Theme
        plum: {
          DEFAULT: '#2A0826',
          dark: '#FFF0F5', // Light Mode Primary Base
          light: '#FFE4EC',
          50: '#FFF8FA',
          100: '#FFE4EC',
          200: '#FFC6D9',
        },
        // 2. SECONDARY - Rich Soft Baby Pink & Hot Rose
        rose: {
          DEFAULT: '#FF5C8A', // Hero Baby Pink Accent
          light: '#FF8FAB', // Soft Baby Pink
          soft: '#FFF0F5', // Soft Blush
          muted: '#684E67', // High-Contrast Muted Slate Text
        },
        // 3. HIGHLIGHT - Antique Imperial Gold (Badges & Super Admin)
        gold: {
          DEFAULT: '#E6A100',
          dark: '#C48800',
          light: '#FFE6A3',
          soft: '#FFF9E6',
        },
        // BACKGROUND SYSTEM (PORCELAIN BLUSH LIGHT MODE)
        blush: {
          DEFAULT: '#FFF0F3',
          card: '#FFFFFF',
          border: '#FFCCE1',
          subtle: '#FFF8FA',
        },
        // TEXT SYSTEM (HIGH-CONTRAST DARK TEXT FOR 100% READABILITY)
        tichi: {
          text: '#2A0826',
          muted: '#684E67',
          faint: '#9B7C99',
          emergency: '#FF2A6D',
          success: '#10B981',
          warning: '#F59E0B',
        },
        // SEMANTIC STATUS COLORS
        emergency: {
          DEFAULT: '#FF2A6D',
          bg: '#FFF0F3',
          border: '#FFCCE1',
          dark: '#D91B55',
        },
        success: {
          DEFAULT: '#10B981',
          bg: '#ECFDF5',
          border: '#A7F3D0',
        },
      },

      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.05em' }],
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'md': ['15px', { lineHeight: '22px' }],
        'lg': ['17px', { lineHeight: '24px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
      },

      borderRadius: {
        'sm': '8px',
        'control': '10px',
        'card': '16px',
        'container': '22px',
        'xl': '18px',
        '2xl': '24px',
      },

      boxShadow: {
        'plum-subtle': '0 2px 12px -2px rgba(42, 8, 38, 0.08), 0 1px 4px -1px rgba(42, 8, 38, 0.04)',
        'plum-md': '0 6px 24px -2px rgba(42, 8, 38, 0.12)',
        'plum-lg': '0 12px 36px -4px rgba(42, 8, 38, 0.18)',
        'coral-glow': '0 0 28px 4px rgba(255, 92, 138, 0.30)',
        'gold-glow': '0 0 28px 4px rgba(230, 161, 0, 0.35)',
        'sos-idle': '0 0 0 8px rgba(255, 42, 109, 0.12), 0 4px 24px -4px rgba(255, 42, 109, 0.25)',
        'sos-glow': '0 0 30px 8px rgba(255, 42, 109, 0.35), 0 4px 20px -2px rgba(255, 42, 109, 0.45)',
        'sos-holding': '0 0 50px 16px rgba(255, 42, 109, 0.55), 0 8px 32px -2px rgba(255, 42, 109, 0.65)',
        'card': '0 2px 8px -1px rgba(42, 8, 38, 0.05), 0 4px 16px -2px rgba(42, 8, 38, 0.04)',
        'card-hover': '0 8px 28px -4px rgba(42, 8, 38, 0.12)',
        'modal': '0 24px 64px -12px rgba(42, 8, 38, 0.25)',
      },

      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pulse-subtle': 'pulse 4s ease-in-out infinite',
        'radar': 'radar 2.4s ease-out infinite',
        'fade-up': 'fadeUp 0.35s ease-out both',
        'slide-in-bottom': 'slideInBottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'scale-in': 'scaleIn 0.25s ease-out both',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        'shield-pulse': 'shieldPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'text-shimmer': 'textShimmer 3.5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'title-reveal': 'titleReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },

      keyframes: {
        radar: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.0)', opacity: '0' },
        },
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInBottom: {
          'from': { opacity: '0', transform: 'translateY(24px) scale(0.97)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.94)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shieldPulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 12px rgba(255, 92, 138, 0.4))' },
          '50%': { transform: 'scale(1.05)', filter: 'drop-shadow(0 0 24px rgba(230, 161, 0, 0.7))' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        textShimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(255, 92, 138, 0.3))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(255, 92, 138, 0.75))' },
        },
        titleReveal: {
          'from': { opacity: '0', transform: 'translateY(18px) scale(0.98)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
