"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  ProjectBreakdown,
  DailyUsageChart,
  SessionTable,
  useUsageData,
} from "@abacus/ui";
import type { DailyUsage, ParsedSession } from "@abacus/parser";
import { ArrowLeft, Search } from "lucide-react";

const jsonFetcher = (url: string) => fetch(url).then((r) => r.json());

function filterDailyByRange(daily: DailyUsage[], range: string): DailyUsage[] {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return daily.filter((d) => d.date >= cutoffStr);
}

export default function ProjectsPage() {
  const { data, isLoading } = useUsageData({});
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: projectData } = useUsageData(
    selectedProject ? { project: selectedProject } : {},
  );

  const { data: sessions } = useSWR<ParsedSession[]>(
    selectedProject
      ? `/api/sessions?project=${encodeURIComponent(selectedProject)}`
      : null,
    jsonFetcher,
  );

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    if (!search) return data.byProject;
    const q = search.toLowerCase();
    return data.byProject.filter((p) =>
      p.projectName.toLowerCase().includes(q),
    );
  }, [data, search]);

  const projectDaily = useMemo(() => {
    if (!projectData) return [];
    return filterDailyByRange(projectData.daily, dateRange);
  }, [projectData, dateRange]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">Failed to load data</p>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedProject(null)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            {selectedProject}
          </h1>
        </div>
        <DailyUsageChart
          data={projectDaily}
          dateRange={dateRange}
          onDateRangeChange={(range) =>
            setDateRange(range as "7d" | "30d" | "90d")
          }
        />
        {sessions && <SessionTable data={sessions} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <ProjectBreakdown
        data={filteredProjects}
        limit={50}
        onProjectClick={setSelectedProject}
      />
    </div>
  );
}
