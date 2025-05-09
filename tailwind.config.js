/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        heading: ['var(--font-poppins)'],
      },
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // Blue
        },
        secondary: {
          DEFAULT: '#6366f1', // Indigo
        },
        accent: {
          DEFAULT: '#f59e0b', // Amber
        },
        base: {
          '100': '#ffffff',
          '200': '#f8f9fa',
          '300': '#e9ecef',
          content: '#000000',
        },
        neutral: {
          DEFAULT: '#f8f9fa',
          content: '#212529',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#3b82f6",
          "secondary": "#6366f1",
          "accent": "#f59e0b",
          "neutral": "#f8f9fa",
          "base-100": "#ffffff",
          "base-200": "#f8f9fa",
          "base-300": "#e9ecef",
          "base-content": "#000000",
          "neutral-content": "#212529",
          "primary-content": "#ffffff",
          "secondary-content": "#ffffff",
          "accent-content": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272"
        }
      },
      "dark", "corporate", "business", "emerald"
    ],
    darkTheme: "light",
  },
} 