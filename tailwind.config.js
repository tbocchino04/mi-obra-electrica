/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        violet: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c5cc9",
          700: "#6d28d9",
          900: "#1e1530",
        },
        ink: {
          DEFAULT: "#0d0b14",
          50:  "#f7f5fc",
          100: "#f0ebfb",
          200: "#e8e6f2",
          300: "#c5c3d4",
          400: "#9896aa",
          500: "#6e6c7a",
          600: "#4a4858",
          700: "#2a2638",
          800: "#1a1828",
          900: "#141120",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        "fab": "0 4px 20px rgba(13,11,20,.28)",
        "fab-hover": "0 8px 28px rgba(13,11,20,.38)",
        "card": "0 1px 3px rgba(13,11,20,.06)",
        "modal": "0 -4px 32px rgba(13,11,20,.18)",
      },
    },
  },
  plugins: [],
};
