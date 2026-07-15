export const KALEIDOSCOPE_COLORS = [
  { bg: "#7C3AED", light: "#A78BFA" },
  { bg: "#EC4899", light: "#F9A8D4" },
  { bg: "#F97316", light: "#FDBA74" },
  { bg: "#06B6D4", light: "#67E8F9" },
  { bg: "#10B981", light: "#6EE7B7" },
  { bg: "#CA8A04", light: "#FACC15" },
  { bg: "#3B82F6", light: "#93C5FD" },
  { bg: "#EF4444", light: "#FCA5A5" },
];

const hexToRgb = (hex = "") => {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return null;
  const value = Number.parseInt(clean, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

export const getReadableColorText = (color = {}) => {
  const rgb = hexToRgb(color.bg);
  if (!rgb) return "#fff";
  const luminance = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  return luminance > 0.58 ? "#1F2937" : "#fff";
};
