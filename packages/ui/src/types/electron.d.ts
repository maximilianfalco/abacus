import type { UsageSummary, ProjectUsage, ParsedSession } from "@abacus/parser";

export interface ElectronAPI {
  getUsageData: (params: Record<string, string | undefined>) => Promise<UsageSummary>;
  getProjects: () => Promise<ProjectUsage[]>;
  getSessions: (params: Record<string, string | undefined>) => Promise<ParsedSession[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
