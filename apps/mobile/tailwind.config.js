/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e1b",
        bgtop: "#0e1426",
        surface: "#121a2e",
        surface2: "#16203a",
        surface3: "#1b2742",
        line: "#222e48",
        line2: "#2d3a57",
        gold: "#d8b45a",
        goldbright: "#e8c873",
        golddeep: "#b8923d",
        ink: "#f3f0e7",
        dim: "#97a0b5",
        mut: "#6a7388",
        danger: "#e25555",
        ok: "#3fbf6a",
      },
      fontFamily: {
        serif: ["PlayfairDisplay_700Bold"],
        serifsemi: ["PlayfairDisplay_600SemiBold"],
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
        mono: ["SpaceMono_400Regular"],
      },
    },
  },
  plugins: [],
};
