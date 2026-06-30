/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ------------------------------------------------------------------
      // Custom fonts (Google fonts imported in globals.css)
      // ------------------------------------------------------------------
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"], // headings, logo
        sans: ["Inter", "sans-serif"],            // body, nav
      },

      // ------------------------------------------------------------------
      // Brand colours
      // ------------------------------------------------------------------
      colors: {
        gold: "#F5C518",
        "dark-gold": "#D4A017",
        navy: "#0a1628",
        "navy-mid": "#0d2137",
      },

      // ------------------------------------------------------------------
      // Optional extra utilities (you may keep or delete)
      // ------------------------------------------------------------------
      boxShadow: {
        glow: "0 0 15px rgba(245,197,24,.6)",
      },
    },
  },
  plugins: [],
};