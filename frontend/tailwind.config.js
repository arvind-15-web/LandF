/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink: {
          900: '#0D0D0D',
          800: '#1A1A1A',
          700: '#2D2D2D',
          600: '#404040',
          500: '#595959',
          400: '#737373',
          300: '#8C8C8C',
          200: '#BFBFBF',
          100: '#E6E6E6',
          50:  '#F5F5F5',
        },
        amber: {
          400: '#FFC107',
          500: '#FFB300',
          600: '#FFA000',
        },
        signal: {
          red: '#FF3B30',
          green: '#34C759',
          blue: '#007AFF',
          orange: '#FF9500',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
