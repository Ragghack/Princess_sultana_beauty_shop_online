/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Pink
        primary: {
          50: "#FDF5F7",
          100: "#FCE8ED",
          200: "#FAD4DD",
          300: "#F4B8C5",
          400: "#E89BAB",
          500: "#DC7E91",
          600: "#C96078",
          700: "#A94860",
          800: "#7D3447",
          900: "#52212E",
        },
        // Secondary Nude/Cream
        secondary: {
          50: "#FEFDFB",
          100: "#FFF8F0",
          200: "#FFF0E0",
          300: "#F5E6D3",
          400: "#E8D4BE",
          500: "#D4BEA8",
          600: "#B89D82",
          700: "#9A7E64",
          800: "#6B5846",
          900: "#4A3C30",
        },
        // Rose Gold
        "rose-gold": {
          50: "#FAF0F0",
          100: "#F5E0E0",
          200: "#EBC8C8",
          300: "#D4A5A5",
          400: "#C08E8E",
          500: "#A97676",
          600: "#8F5E5E",
          700: "#6F4747",
          800: "#4F3333",
          900: "#2F1E1E",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(244, 184, 197, 0.1)",
        "soft-md": "0 4px 16px rgba(244, 184, 197, 0.15)",
        "soft-lg": "0 8px 32px rgba(244, 184, 197, 0.2)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
