/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffaeb',
          100: '#fff4c6',
          200: '#ffe888',
          300: '#ffde59',
          400: '#ffd124',
          500: '#ffc107',
          600: '#e69500',
          700: '#bf6a02',
          800: '#9c5208',
          900: '#7d420b',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#235fe7',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
