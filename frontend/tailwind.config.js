/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Brown
        primary: {
          50: "#FBF5EE",
          100: "#F4E6D4",
          200: "#E9CEA8",
          300: "#DD857B",
          400: "#CD9145",
          500: "#B76E22",
          600: "#9A5C1C",
          700: "#7C4A16",
          800: "#5D3710",
          900: "#3F250B",
        },

        // Secondary Nude/Cream
        secondary: {
          50: "#FEFCF9",
          100: "#F8F1E8",
          200: "#EFE1CF",
          300: "#E5CFB5",
          400: "#D9B996",
          500: "#CBA378",
          600: "#B48B61",
          700: "#94724E",
          800: "#75593B",
          900: "#523E28",
        },
        // Rose Gold
        "rose-gold": {
          50: "#FCF6F1",
          100: "#F6E8DC",
          200: "#EDD1B9",
          300: "#E3B995",
          400: "#D79C6A",
          500: "#C27E3F",
          600: "#A9682F",
          700: "#8A5324",
          800: "#6B3F1A",
          900: "#4A2B11",
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
