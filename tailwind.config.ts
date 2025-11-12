import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7C3AED", // playful violet
          accent: "#F59E0B"   // warm amber
        }
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "Noto Sans JP", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
