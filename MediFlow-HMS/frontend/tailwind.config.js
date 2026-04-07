/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      gridTemplateColumns: {
        'auto': 'repeat(auto-fill, minmax(200px, 1fr))'
      },
      colors: {
        'primary': '#0F766E',
        'secondary': '#10233F',
        'accent': '#F6B73C',
        'background-soft': '#EEF5F7',
        'success': '#1F8A70',
        'error': '#D75465',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 18px 50px rgba(16, 35, 63, 0.08)',
        'glass': '0 24px 60px rgba(15, 59, 84, 0.16)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #10233F 0%, #0F766E 52%, #3CB7A0 100%)',
        'glass-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.46))',
      }
    },
  },
  plugins: [],
}
