/** @type {import('tailwindcss').Config} */

// Kerala green — deep, calm, government-grade. Also mapped onto `teal` so any
// remaining legacy `teal-*` utility picks up the same palette.
const brand = {
  50: '#effaf3',
  100: '#d6f2e0',
  200: '#b0e4c4',
  300: '#7fd0a1',
  400: '#4bb87c',
  500: '#2a9d62',
  600: '#1e8450',
  700: '#186a42',
  800: '#145437',
  900: '#0f4230',
  950: '#082a1e',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand,
        teal: brand,
        admin: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px -6px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
