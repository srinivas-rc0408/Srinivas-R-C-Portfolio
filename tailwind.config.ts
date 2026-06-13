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
        background: "#05050A",
        primary: "#05050A",
        accent: "#6C63FF",
        secondary: "#FF6584",
        surface: "#0A0A12",
        card: "#0A0A12",
        border: "#1F1F2E",
        text: {
          main: "#E8E8FF",
          primary: "#E8E8FF",
          muted: "#8888BB",
        }
      },
      fontFamily: {
        sans: ["var(--font-space)"],
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
        },
        gradientWash: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        slideInLeft: "slideInLeft 0.5s ease-out forwards",
        glitch: "glitch 0.3s ease-in-out infinite",
        gradientWash: "gradientWash 15s ease infinite",
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;
