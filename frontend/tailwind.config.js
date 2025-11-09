/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
          brand: {
          50: '#eef8ff',
          100: '#dff3ff',
          200: '#bfe8ff',
          300: '#9fdcff',
          400: '#66c9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1e40af',
          800: '#132f6b',
          900: '#0b1b3a'
        },
          success: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b'
          },
          warning: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          },
          danger: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
          },
          info: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81'
          },
          sidebar: {
            bg: '#f8f9fa',
            hover: '#e9ecef',
            active: '#eef8ff'
          }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      spacing: {
        sidebar: '16rem'
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      boxShadow: {
        'card-sm': '0 1px 2px rgba(16,24,40,0.03), 0 1px 3px rgba(16,24,40,0.06)',
        'card-md': '0 4px 12px rgba(16,24,40,0.08)',
        'card-lg': '0 8px 30px rgba(16,24,40,0.12)'
      },
      transitionDuration: {
        200: '200ms',
        300: '300ms'
      }
    },
  },
  plugins: [],
}

