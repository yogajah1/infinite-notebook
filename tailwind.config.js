/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        surface: '#f9fafb',
        border: '#e5e7eb',
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
