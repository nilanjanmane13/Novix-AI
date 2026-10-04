/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        ink: {
          950: "#05030a",
          900: "#0a0713",
          850: "#0e0a1a",
          800: "#150f26",
          700: "#1e1636",
          600: "#2b2147",
        },
        violet: {
          50: "#f5f2ff",
          100: "#ebe4ff",
          200: "#d4c6ff",
          300: "#b7a1ff",
          400: "#9a7bff",
          500: "#7c5cfc",
          600: "#6a3ff0",
          700: "#5730c4",
          800: "#402590",
          900: "#241458",
        },
        mist: {
          100: "#f4f1ff",
          200: "#e1dbf3",
          300: "#cbc3e2",
          400: "#aaa1c6",
          500: "#8a809f",
          600: "#675e7e",
        },
        success: "#43dba8",
        warn: "#f6bb5e",
        danger: "#f5707c",
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        body: ["Figtree", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(154,123,255,0.25), 0 18px 50px -14px rgba(124,92,252,0.65)",
        "glow-sm": "0 0 24px -4px rgba(154,123,255,0.55)",
      },
      keyframes: {
        "drift-a": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(6vw,4vh,0) scale(1.12)" },
        },
        "drift-b": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1.05)" },
          "50%": { transform: "translate3d(-7vw,-5vh,0) scale(0.95)" },
        },
        float: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-10px,0)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        "dot-bounce": {
          "0%,80%,100%": { transform: "translateY(0)", opacity: "0.45" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(245,112,124,0.5)" },
          "100%": { boxShadow: "0 0 0 14px rgba(245,112,124,0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "drift-a": "drift-a 26s ease-in-out infinite",
        "drift-b": "drift-b 32s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
        breathe: "breathe 4s ease-in-out infinite",
        "dot-bounce": "dot-bounce 1.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
