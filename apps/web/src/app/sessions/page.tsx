"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { SessionTable, useUsageData } from "@abacus/ui";
import type { ParsedSession } from "@abacus/parser";
import { Filter } from "lucide-react";

const jsonFetcher = (url: string) => fetch(url).then((r) => r.json());

function buildSessionUrl(filters: {
  project?: string;
  model?: string;
  from?: string;
  to?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.project) params.set("project", filters.project);
  if (filters.model) params.set("model", filters.model);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return `/api/sessions${qs ? `?${qs}` : ""}`;
}

export default function SessionsPage() {
  const { data: usageData } = useUsageData({});
  const [project, setProject] = useState("");
  const [model, setModel] = useState("");
  const [dateRange, setDateRange] = useState("30d");

  const dateFilters = useMemo(() => {
    if (dateRange === "all") return {};
    const days = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { from: from.toISOString() };
  }, [dateRange]);

  const url = buildSessionUrl({
    project: project || undefined,
    model: model || undefined,
    ...dateFilters,
  });

  const { data: sessions, isLoading } = useSWR<ParsedSession[]>(
    url,
    jsonFetcher,
  );

  const projects = useMemo(() => {
    if (!usageData) return [];
    return usageData.byProject.map((p) => p.projectName).sort();
  }, [usageData]);

  const models = useMemo(() => {
    if (!usageData) return [];
    return usageData.byModel.map((m) => m.model).sort();
  }, [usageData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Sessions</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All models</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Loading sessions...
          </div>
        </div>
      ) : (
        <SessionTable data={sessions ?? []} pageSize={20} />
      )}
    </div>
  );
}
