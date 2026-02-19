export interface AppConfig {
  dataPath: string;
  mode: "local" | "sender" | "receiver";
  syncEndpoint?: string;
  syncApiKey?: string;
  syncIntervalHours: number;
}

export function getConfig(): AppConfig {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return {
    dataPath: (process.env.CLAUDE_DATA_PATH || "~/.claude/projects").replace(
      "~",
      home,
    ),
    mode: (process.env.APP_MODE as AppConfig["mode"]) || "local",
    syncEndpoint: process.env.SYNC_ENDPOINT,
    syncApiKey: process.env.SYNC_API_KEY,
    syncIntervalHours: Number(process.env.SYNC_INTERVAL_HOURS) || 1,
  };
}
