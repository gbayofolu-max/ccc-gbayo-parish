/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Merriweather', 'serif'], 
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        // Navy/Gold Palette
        gold: "#F5C518",
        "dark-gold": "#D4A017",
        navy: "#0a1628",
        "navy-mid": "#0d2137",
        // Emerald Palette (Professional/Sacred)
        "ccc-emerald": "#047857",
        "ccc-gold": "#d97706",
      },
      boxShadow: {
        glow: "0 0 15px rgba(245,197,24,.6)",
      },
    },
  },
  plugins: [],
};