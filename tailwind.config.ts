import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F6F4E8",
        sidebar: "#E5EEE4",
        surface: "#E5EEE4",
        surfaceSubtle: "#F6F4E8",
        input: "rgba(255, 255, 255, 0.78)",
        border: "rgba(47, 52, 50, 0.12)",
        textPrimary: "#2F3432",
        textSecondary: "rgba(47, 52, 50, 0.65)",
        textMuted: "rgba(47, 52, 50, 0.46)",
        primary: "#C0E1D2",
        primarySoft: "rgba(192, 225, 210, 0.42)",
        accent: "#DC9B9B",
        accentSoft: "rgba(220, 155, 155, 0.22)",
        panel: "rgba(255, 255, 255, 0.72)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        card: "8px",
        panel: "8px",
      },
      boxShadow: {
        subtle: "0 12px 30px rgba(47, 52, 50, 0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
