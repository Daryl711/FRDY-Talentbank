// Design tokens mirrored from tailwind.config.js for use in places where
// className isn't available (LinearGradient colors, icon tints, etc.)

export const colors = {
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
};

export const gradients = {
  screen: ["#0e1426", "#0a0e1b"] as const,
  featured: ["#1d3057", "#15233f"] as const,
  matchCard: ["#26421f", "#1a3326", "#16271f"] as const,
  gold: ["#e8c873", "#cda14a"] as const,
  goldBtn: ["#e8c873", "#b8923d"] as const,
  bar: ["#cda14a", "#e8c873"] as const,
};
