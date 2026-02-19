export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheCreationPerMillion: number;
  cacheReadPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {
  "claude-opus-4": {
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
    cacheCreationPerMillion: 18.75,
    cacheReadPerMillion: 1.5,
  },
  "claude-sonnet-4": {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cacheCreationPerMillion: 3.75,
    cacheReadPerMillion: 0.3,
  },
  "claude-haiku-4": {
    inputPerMillion: 0.8,
    outputPerMillion: 4.0,
    cacheCreationPerMillion: 1.0,
    cacheReadPerMillion: 0.08,
  },
};

// Fallback alias: older model IDs
const MODEL_ALIASES: Record<string, string> = {
  "claude-3-5-sonnet": "claude-sonnet-4",
  "claude-3-5-haiku": "claude-haiku-4",
  "claude-3-opus": "claude-opus-4",
};

/**
 * Normalize a full model ID to a base model key.
 * "claude-sonnet-4-6-20250514" → "claude-sonnet-4"
 */
export function normalizeModelName(model: string): string {
  if (!model || model === "<synthetic>") return "unknown";

  // Direct match
  if (PRICING[model]) return model;

  // Check aliases
  for (const [alias, base] of Object.entries(MODEL_ALIASES)) {
    if (model.startsWith(alias)) return base;
  }

  // Try stripping version suffix: "claude-opus-4-6-20250514" → "claude-opus-4"
  for (const key of Object.keys(PRICING)) {
    if (model.startsWith(key)) return key;
  }

  return model;
}

export interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
}

export function calculateCost(model: string, tokens: TokenCounts): number {
  const normalized = normalizeModelName(model);
  // Fall back to opus pricing for unknown models
  const pricing = PRICING[normalized] ?? PRICING["claude-opus-4"];

  const input = (tokens.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const output = (tokens.outputTokens / 1_000_000) * pricing.outputPerMillion;
  const cacheCreation =
    ((tokens.cacheCreationTokens ?? 0) / 1_000_000) *
    pricing.cacheCreationPerMillion;
  const cacheRead =
    ((tokens.cacheReadTokens ?? 0) / 1_000_000) * pricing.cacheReadPerMillion;

  return input + output + cacheCreation + cacheRead;
}

export function getPricingTable(): Record<string, ModelPricing> {
  return { ...PRICING };
}
