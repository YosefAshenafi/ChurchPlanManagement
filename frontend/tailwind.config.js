/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans Ethiopic', 'sans-serif'],
      },
      colors: {
        sidebar: '#1E1B4B',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        church: {
          primary: '#4F46E5',
          'primary-content': '#ffffff',
          secondary: '#059669',
          'secondary-content': '#ffffff',
          accent: '#D97706',
          'accent-content': '#ffffff',
          neutral: '#1E293B',
          'neutral-content': '#F8FAFC',
          'base-100': '#ffffff',
          'base-200': '#F8FAFC',
          'base-300': '#E2E8F0',
          'base-content': '#1E293B',
          info: '#3B82F6',
          'info-content': '#ffffff',
          success: '#059669',
          'success-content': '#ffffff',
          warning: '#D97706',
          'warning-content': '#ffffff',
          error: '#DC2626',
          'error-content': '#ffffff',
        },
      },
    ],
    darkTheme: false,
    logs: false,
  },
};
