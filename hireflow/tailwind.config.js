/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Exact color tokens copied from the original HTML :root variables.
        // Keeping the same names makes it trivial to cross-reference the
        // original design against the Tailwind classes used in components.
        bg: "#0f0f0f",
        surface: "#161616",
        surface2: "#1e1e1e",
        surface3: "#252525",
        border: "#2a2a2a",
        border2: "#383838",
        text: "#e8e8e8",
        muted: "#888888",
        muted2: "#555555",
        accent: "#c8f542",
        "accent-dim": "#8ab52e",
        "accent-hover": "#d8ff52",
        danger: "#ff4d4d",
        warn: "#f5a623",
        info: "#4da6ff",
        success: "#4de17a",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      keyframes: {
        bounce2: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        bounce2: "bounce2 0.9s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
