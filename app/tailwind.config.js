/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        telegram: {
          beige: '#DFD8CB',
          blue: {
            DEFAULT: '#37AFE2',
            dark: '#1B92D1'
          },
          gray: {
            light: '#C8D9EA',
            lighter: '#ECF5FB'
          }
        }
      }
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};