"use client";

import useSWR from "swr";
import type { UsageSummary } from "@abacus/parser";

interface ElectronWindow extends Window {
  electronAPI: {
    getUsageData: (p: Record<string, string | undefined>) => Promise<UsageSummary>;
  };
}

export interface UseUsageDataParams {
  dateRange?: "7d" | "30d" | "90d" | "custom";
  from?: string;
  to?: string;
  groupBy?: "daily" | "weekly" | "monthly";
  project?: string;
  model?: string;
}

export interface UseUsageDataReturn {
  data: UsageSummary | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

function buildKey(params: UseUsageDataParams): string {
  const parts = ["usage", params.dateRange ?? "30d"];
  if (params.from) parts.push(`from:${params.from}`);
  if (params.to) parts.push(`to:${params.to}`);
  if (params.groupBy) parts.push(`group:${params.groupBy}`);
  if (params.project) parts.push(`project:${params.project}`);
  if (params.model) parts.push(`model:${params.model}`);
  return parts.join("|");
}

function buildQueryString(params: UseUsageDataParams): string {
  const entries: Array<[string, string]> = [];
  if (params.dateRange) entries.push(["dateRange", params.dateRange]);
  if (params.from) entries.push(["from", params.from]);
  if (params.to) entries.push(["to", params.to]);
  if (params.groupBy) entries.push(["groupBy", params.groupBy]);
  if (params.project) entries.push(["project", params.project]);
  if (params.model) entries.push(["model", params.model]);
  return new URLSearchParams(entries).toString();
}

const isElectron =
  typeof window !== "undefined" && "electronAPI" in window;

async function fetcher(params: UseUsageDataParams): Promise<UsageSummary> {
  if (isElectron) {
    return (window as unknown as ElectronWindow).electronAPI.getUsageData(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
    );
  }
  const qs = buildQueryString(params);
  const res = await fetch(`/api/usage?${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch usage data: ${res.status}`);
  return res.json() as Promise<UsageSummary>;
}

export function useUsageData(params: UseUsageDataParams): UseUsageDataReturn {
  const key = buildKey(params);

  const { data, error, isLoading, mutate, isValidating } = useSWR<UsageSummary, Error>(
    key,
    () => fetcher(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5 * 60 * 1000,
      errorRetryCount: 2,
    },
  );

  return {
    data: data ?? null,
    isLoading: isLoading || isValidating,
    error: error ?? null,
    refetch: async () => { await mutate(); },
    lastUpdated: data ? new Date() : null,
  };
}
