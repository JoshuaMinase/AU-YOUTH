/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'au-green': '#0F2A1A',
        'au-blue': '#2F80ED',
        'au-tan': '#DAC48C',
        'au-gold': '#C8AC5C',
      },
    },
  },
  plugins: [],
}
