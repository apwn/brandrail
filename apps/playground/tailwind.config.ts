import type { Config } from "tailwindcss";

// The playground design system IS the product demo: rigid grid, one accent,
// zero gradients, zero blobs. See build spec Part 4.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      ink: "#0A0A0B",
      bone: "#F4F2EE",
      signal: "#FF4D00",
      panel: "#141416",
      panel2: "#1A1A1C",
      hairline: "#2E2E32",
      "hairline-soft": "#1E1E21",
      muted: "#9B978F",
      green: "#3ECF8E", // terminal success states only
      white: "#FFFFFF",
      black: "#000000",
    },
    borderRadius: {
      none: "0",
      DEFAULT: "2px", // 2px max — no blobs
    },
    fontFamily: {
      display: ["var(--font-display)", "sans-serif"],
      body: ["var(--font-body)", "sans-serif"],
      mono: ["var(--font-mono)", "monospace"],
    },
    extend: {
      transitionTimingFunction: {
        mech: "cubic-bezier(0.2, 0, 0, 1)", // mechanical: snap, no bounce
      },
      transitionDuration: {
        mech: "100ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
