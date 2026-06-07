/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
      colors: {
        acc: {
          purple: '#A100FF',
          'purple-dark': '#7B00C2',
          'purple-light': '#E8B4FF',
          'purple-faint': '#F5E6FF',
          black: '#000000',
          'gray-1': '#F2F2F2',
          'gray-2': '#E6E6E6',
          'gray-3': '#CCCCCC',
          'gray-4': '#999999',
          'gray-5': '#666666',
          'gray-6': '#333333',
        }
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        full: '9999px',
      }
    },
  },
  plugins: [],
}
