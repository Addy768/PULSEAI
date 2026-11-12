import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05080F",
          900: "#080D18",
          850: "#0B1220",
          800: "#0F1729",
          700: "#16213A",
          600: "#1F2C4A",
        },
        line: "rgba(148, 170, 214, 0.12)",
        accent: {
          DEFAULT: "#3D8BFF",
          soft: "rgba(61, 139, 255, 0.14)",
        },
        ok: "#2FD39A",
        warn: "#F5B544",
        crit: "#FF5470",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        fadeUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pulse-ring": "pulseRing 2s ease-out infinite",
        "fade-up": "fadeUp 0.7s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
