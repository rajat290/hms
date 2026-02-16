/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        'auto': 'repeat(auto-fill, minmax(200px, 1fr))'
      },
      colors: {
        'primary': '#5F6FFF',
        'secondary': '#2D3748',
        'accent': '#4FD1C5',
        'background-soft': '#F7FAFC',
        'success': '#48BB78',
        'error': '#E53E3E',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5F6FFF 0%, #4A5AE0 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      }
    },
  },
  plugins: [],
}