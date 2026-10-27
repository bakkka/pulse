import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F7F9",
        ink: {
          DEFAULT: "#0B1220",
          900: "#101828",
          800: "#1D2939",
          700: "#344054",
          600: "#475467",
        },
        line: {
          DEFAULT: "#E7EAF0",
          soft: "#F0F2F6",
        },
        brand: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          600: "#4F46E5",
          700: "#4338CA",
        },
        good: "#12B76A",
        warn: "#F79009",
        bad: "#F04438",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI Variable Text",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      borderRadius: {
        xl: "0.8rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)",
        pop: "0 12px 32px -12px rgba(16,24,40,0.18), 0 2px 6px rgba(16,24,40,0.04)",
        ring: "0 0 0 4px rgba(79,70,229,0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
