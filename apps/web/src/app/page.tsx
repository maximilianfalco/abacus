"use client";

import { useState, useMemo } from "react";
import {
  CostSummaryCard,
  DailyUsageChart,
  ModelBreakdown,
  UsageHeatmap,
  ProjectBreakdown,
  useUsageData,
  type CostSummaryCardProps,
} from "@abacus/ui";
import type { DailyUsage, UsageSummary } from "@abacus/parser";

function sumPeriod(days: DailyUsage[]): { tokens: number; cost: number } {
  let tokens = 0;
  let cost = 0;
  for (const d of days) {
    tokens += d.inputTokens + d.outputTokens;
    cost += d.cost;
  }
  return { tokens, cost };
}

function toLocalDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function computePeriods(
  daily: DailyUsage[],
  summary: UsageSummary,
): CostSummaryCardProps {
  const now = new Date();
  const todayStr = toLocalDateStr(now);

  const today = sumPeriod(daily.filter((d) => d.date === todayStr));

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);
  const yesterdayData = sumPeriod(daily.filter((d) => d.date === yesterdayStr));

  const dow = now.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + mondayOffset);
  const mondayStr = toLocalDateStr(monday);
  const thisWeek = sumPeriod(
    daily.filter((d) => d.date >= mondayStr && d.date <= todayStr),
  );

  const lastMonday = new Date(monday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastMondayStr = toLocalDateStr(lastMonday);
  const lastSunday = new Date(monday);
  lastSunday.setDate(lastSunday.getDate() - 1);
  const lastSundayStr = toLocalDateStr(lastSunday);
  const lastWeek = sumPeriod(
    daily.filter((d) => d.date >= lastMondayStr && d.date <= lastSundayStr),
  );

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const thisMonth = sumPeriod(
    daily.filter((d) => d.date >= monthStart && d.date <= todayStr),
  );

  const lastMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = toLocalDateStr(lastMonthFirst);
  const lastMonthLast = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthEndStr = toLocalDateStr(lastMonthLast);
  const lastMonth = sumPeriod(
    daily.filter(
      (d) => d.date >= lastMonthStart && d.date <= lastMonthEndStr,
    ),
  );

  const allTime = {
    tokens: summary.totalInputTokens + summary.totalOutputTokens,
    cost: summary.totalCost,
  };

  return {
    current: { today, thisWeek, thisMonth, allTime },
    previous: { yesterday: yesterdayData, lastWeek, lastMonth },
  };
}

function filterDailyByRange(daily: DailyUsage[], range: string): DailyUsage[] {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return daily.filter((d) => d.date >= cutoffStr);
}

export default function DashboardPage() {
  const { data, isLoading, error } = useUsageData({});
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const periods = useMemo(() => {
    if (!data) return null;
    return computePeriods(data.daily, data);
  }, [data]);

  const filteredDaily = useMemo(() => {
    if (!data) return [];
    return filterDailyByRange(data.daily, dateRange);
  }, [data, dateRange]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading usage data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-destructive">Failed to load usage data</p>
        <p className="text-sm text-muted-foreground">
          Check that CLAUDE_DATA_PATH is set correctly in .env.local
        </p>
      </div>
    );
  }

  if (data.daily.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium text-foreground">No usage data found</p>
        <p className="text-sm text-muted-foreground">
          Make sure your Claude Code JSONL files are at the configured data path
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {periods && (
        <CostSummaryCard
          current={periods.current}
          previous={periods.previous}
        />
      )}
      <div className="grid h-[38vh] grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="h-full lg:col-span-2">
          <DailyUsageChart
            data={filteredDaily}
            dateRange={dateRange}
            onDateRangeChange={(range) =>
              setDateRange(range as "7d" | "30d" | "90d")
            }
          />
        </div>
        <ModelBreakdown data={data.byModel} />
      </div>
      <div className="grid h-[38vh] grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="h-full lg:col-span-2">
          <UsageHeatmap data={data.daily} />
        </div>
        <ProjectBreakdown data={data.byProject} limit={5} />
      </div>
    </div>
  );
}
