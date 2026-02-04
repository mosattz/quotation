/** @type {import('tailwindcss').Config} */
export default {
  // We control dark mode via Settings (per-user), not OS preference.
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
