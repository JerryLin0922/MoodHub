/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode (toggled by src/theme.ts).
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Medical blue brand palette (#1890FF family) + calm neutral base.
        brand: {
          DEFAULT: '#1890FF',
          50: '#E6F4FF',
          100: '#BAE0FF',
          200: '#91CAFF',
          300: '#69B1FF',
          400: '#4096FF',
          500: '#1677FF',
          600: '#1677FF',
          700: '#0958D9',
          800: '#003EB3',
          900: '#002C8C',
        },
        // Warm low-saturation earth tones for the "calm minimal" base.
        warm: {
          50: '#FAFAF7',
          100: '#F5F3EE',
          200: '#EAE6DD',
          300: '#D8D2C4',
          700: '#6B6455',
          800: '#4A4439',
          900: '#2E2A23',
        },
      },
      fontFamily: {
        // HarmonyOS Sans on coarse pointers (mobile), Microsoft YaHei elsewhere.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"HarmonyOS Sans SC"',
          '"HarmonyOS Sans"',
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};
