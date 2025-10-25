/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#39FF14', // neon green
        neonCyan: '#00FFF0',
        neonBlue: '#00A3FF',
        neonPurple: '#B400FF',
        darkBg: '#0b1020',
        glass: 'rgba(255,255,255,0.08)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem'
      }
    },
  },
  plugins: [],
};


