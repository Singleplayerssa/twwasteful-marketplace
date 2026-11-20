/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#354024', olive: '#889063', soil: '#4C3D19', sand: '#CFBB99', cream: '#E5D7C4'
      },
      fontFamily: { sans: ['DM Sans', 'Arial', 'sans-serif'], display: ['DM Serif Display', 'Georgia', 'serif'] },
      boxShadow: { soft: '0 14px 40px rgba(53,64,36,.08)' }
    }
  },
  plugins: []
};
