import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        primary: "#000000",
        accent: "#6C63FF",
        secondary: "#FF6584",
        surface: "#1A1A2E",
        text: {
          main: "#E8E8FF",
          primary: "#E8E8FF",
          muted: "#8888BB",
        }
      },
      fontFamily: {
        inter: ["var(--font-inter)"],
        space: ["var(--font-space)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        }
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        slideInLeft: "slideInLeft 0.5s ease-out forwards",
        glitch: "glitch 0.3s ease-in-out infinite",
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;
