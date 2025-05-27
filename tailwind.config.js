// tailwind.config.js

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#f0f8f4",
          DEFAULT: "#a4d4ae",
          dark: "#75a98a"
        },
        accent: {
          light: "#fdf6ec",
          DEFAULT: "#f4c095",
          dark: "#dd9555"
        },
        text: {
          DEFAULT: "#374151",
          muted: "#6b7280"
        },
        background: {
          DEFAULT: "#fefcfb",
          soft: "#f9f9f7"
        }
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Poppins'", "sans-serif"]
      },
      boxShadow: {
        soft: "0 4px 8px rgba(0, 0, 0, 0.05)",
        focus: "0 0 0 3px rgba(164, 212, 174, 0.45)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio")
  ]
}
