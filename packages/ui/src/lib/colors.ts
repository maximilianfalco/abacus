export const TOKEN_COLORS = {
  input: "#3B82F6",
  output: "#10B981",
  cacheCreation: "#F59E0B",
  cacheRead: "#8B5CF6",
} as const;

export const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4": "#7C3AED",
  "claude-sonnet-4": "#3B82F6",
  "claude-haiku-4": "#14B8A6",
};

export const HEATMAP_COLORS = {
  green: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  blue: ["#ebedf0", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
  purple: ["#ebedf0", "#c4b5fd", "#a78bfa", "#7c3aed", "#5b21b6"],
} as const;

export const COMPARISON_COLORS = {
  positive: "#EF4444",
  negative: "#10B981",
} as const;
