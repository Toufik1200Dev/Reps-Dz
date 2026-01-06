/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#FFD700",
        accent: "#FFED4E",
        dark: {
          900: "#121212",
          800: "#1E1E1E",
          700: "#2D2D2D",
        },
        gray: {
          100: "#F9F9F9",
          200: "#E5E5E5",
          800: "#333333",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #121212 0%, #000000 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)',
      }
    },
  },
  plugins: [],
}

