"use client";

import { useTheme } from "@/src/components/theme-provider";

const DEFAULT_COLORS = {
  success: "#10b981",
  successLight: "#6ee7b7",
  successSoft: "emerald-500",
  successText: "emerald-600",
  danger: "#ef4444",
  dangerLight: "#fca5a5",
  dangerStrong: "#dc2626",
  dangerSoft: "red-500",
  dangerText: "red-600",
};

const COLORBLIND_COLORS = {
  success: "#5b50ff",
  successLight: "#a5a0ff",
  successSoft: "indigo-600",
  successText: "indigo-600",
  danger: "#000000",
  dangerLight: "#6b7280",
  dangerStrong: "#000000",
  dangerSoft: "neutral-900",
  dangerText: "neutral-900",
};

// Standard mode = vert + rouge.
// Le violet brand et le noir des graphiques sont remappés vers vert/rouge.
const STANDARD_REMAP = {
  "#5b50ff": "#10b981",
  "#5B50FF": "#10b981",
  "#5B4FFF": "#10b981",
  "#5b4fff": "#10b981",
  "#4840cc": "#059669",
  "rgba(90, 80, 255, 0.60)": "rgba(16, 185, 129, 0.60)",
  "#000000": "#ef4444",
  "#1a1a1a": "#dc2626",
  "#333333": "#dc2626",
  "#a44fff": "#6ee7b7",
  "#e8e6ff": "#d1fae5",
};

// Colorblind mode = bleu brand (#5b50ff) + noir.
const COLORBLIND_REMAP = {
  // Brand violet stays
  "#5b50ff": "#5b50ff",
  "#5B50FF": "#5b50ff",
  "#5B4FFF": "#5b50ff",
  "#5b4fff": "#5b50ff",
  "#4840cc": "#4840cc",
  "#a44fff": "#a5a0ff",
  "rgba(90, 80, 255, 0.60)": "rgba(90, 80, 255, 0.60)",
  // Black stays black
  "#000000": "#000000",
  "#1a1a1a": "#1a1a1a",
  "#333333": "#333333",
  // Greens → brand blue
  "#10b981": "#5b50ff",
  "#059669": "#4c43d9",
  "#16a34a": "#5b50ff",
  "#22c55e": "#7a70ff",
  "#6ee7b7": "#a5a0ff",
  "#2DD4BF": "#7a70ff",
  "#14b8a6": "#5b50ff",
  "#0D9488": "#4c43d9",
  "#84cc16": "#a5a0ff",
  // Reds → black / gray
  "#ef4444": "#000000",
  "#EF4444": "#000000",
  "#dc2626": "#000000",
  "#f87171": "#374151",
  "#fca5a5": "#9ca3af",
  // Oranges / yellows → grays
  "#f97316": "#4b5563",
  "#F97316": "#4b5563",
  "#f59e0b": "#6b7280",
  "#F59E0B": "#6b7280",
  "#fbbf24": "#9ca3af",
  "#eab308": "#9ca3af",
  // Other blues / tones
  "#3b82f6": "#5b50ff",
  "#3B82F6": "#5b50ff",
  "#2563eb": "#4c43d9",
  "#93c5fd": "#a5a0ff",
  "#60a5fa": "#7a70ff",
  "#0ea5e9": "#5b50ff",
  "#06b6d4": "#7a70ff",
  "#6366f1": "#5b50ff",
  // Purples → brand blue
  "#a855f7": "#4c43d9",
  "#8b5cf6": "#5b50ff",
  "#8B5CF6": "#5b50ff",
  "#A585DB": "#64748b",
  "#ec4899": "#4c43d9",
  "#EC4899": "#4c43d9",
  // Slate stays
  "#64748b": "#64748b",
  // Light violet pattern stays
  "#e8e6ff": "#e8e6ff",
  "#e5e5e5": "#e5e5e5",
};

function remapColor(color, colorblindMode) {
  if (!color) return color;
  const table = colorblindMode ? COLORBLIND_REMAP : STANDARD_REMAP;
  if (table[color]) return table[color];
  const lower = typeof color === "string" ? color.toLowerCase() : color;
  return table[lower] || color;
}

// Palettes de catégories : verts pour revenus, rouges pour dépenses en standard.
// En mode daltonien : nuances de #5b50ff pour revenus, nuances de noir/gris pour dépenses.
const INCOME_PALETTE_STANDARD = [
  "#10b981",
  "#059669",
  "#34d399",
  "#6ee7b7",
  "#047857",
  "#a7f3d0",
  "#065f46",
  "#14b8a6",
  "#0d9488",
  "#2dd4bf",
];
const INCOME_PALETTE_COLORBLIND = [
  "#5b50ff",
  "#4c43d9",
  "#7a70ff",
  "#a5a0ff",
  "#3d36b3",
  "#c6c3ff",
  "#2e2996",
  "#8078ff",
  "#6057ff",
  "#9890ff",
];
const EXPENSE_PALETTE_STANDARD = [
  "#ef4444",
  "#dc2626",
  "#f87171",
  "#fca5a5",
  "#b91c1c",
  "#fecaca",
  "#991b1b",
  "#f43f5e",
  "#e11d48",
  "#fb7185",
];
const EXPENSE_PALETTE_COLORBLIND = [
  "#000000",
  "#1f2937",
  "#374151",
  "#4b5563",
  "#6b7280",
  "#9ca3af",
  "#111827",
  "#030712",
  "#525252",
  "#737373",
];

export function useChartColors() {
  const { colorblindMode } = useTheme();
  const base = colorblindMode ? COLORBLIND_COLORS : DEFAULT_COLORS;
  const incomePalette = colorblindMode
    ? INCOME_PALETTE_COLORBLIND
    : INCOME_PALETTE_STANDARD;
  const expensePalette = colorblindMode
    ? EXPENSE_PALETTE_COLORBLIND
    : EXPENSE_PALETTE_STANDARD;
  return {
    ...base,
    colorblindMode,
    incomePalette,
    expensePalette,
    getIncomeColor: (index) => incomePalette[index % incomePalette.length],
    getExpenseColor: (index) => expensePalette[index % expensePalette.length],
    remap: (color) => remapColor(color, colorblindMode),
    remapList: (colors) => colors.map((c) => remapColor(c, colorblindMode)),
  };
}
