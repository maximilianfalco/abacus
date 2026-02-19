"use client";

import { useMemo } from "react";
import type { DailyUsage } from "@abacus/parser";
import { HEATMAP_COLORS } from "../lib/colors";
import { formatTokens, formatCost } from "../lib/format";

export interface UsageHeatmapProps {
  data: DailyUsage[];
  year?: number;
  colorScheme?: "green" | "blue" | "purple";
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function UsageHeatmap({ data, year, colorScheme = "green" }: UsageHeatmapProps) {
  const targetYear = year ?? new Date().getFullYear();
  const colors = HEATMAP_COLORS[colorScheme];

  const { grid, monthPositions, maxTokens } = useMemo(() => {
    const lookup = new Map(data.map((d) => [d.date, d]));

    const jan1 = new Date(Date.UTC(targetYear, 0, 1));
    const startDay = jan1.getUTCDay();
    const startDate = new Date(jan1);
    startDate.setUTCDate(startDate.getUTCDate() - startDay);

    const weeks: Array<Array<{ date: string; usage: DailyUsage | undefined; inYear: boolean }>> = [];
    const positions: Array<{ month: number; weekIdx: number }> = [];
    let prevMonth = -1;
    let max = 0;

    const cursor = new Date(startDate);
    let weekIdx = 0;

    while (weekIdx < 53) {
      const week: Array<{ date: string; usage: DailyUsage | undefined; inYear: boolean }> = [];
      for (let dow = 0; dow < 7; dow++) {
        const iso = cursor.toISOString().slice(0, 10);
        const inYear = cursor.getUTCFullYear() === targetYear;
        const usage = lookup.get(iso);
        if (usage) {
          const total = usage.inputTokens + usage.outputTokens;
          if (total > max) max = total;
        }
        if (inYear && cursor.getUTCMonth() !== prevMonth) {
          positions.push({ month: cursor.getUTCMonth(), weekIdx });
          prevMonth = cursor.getUTCMonth();
        }
        week.push({ date: iso, usage, inYear });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      weeks.push(week);
      weekIdx++;
      if (cursor.getUTCFullYear() > targetYear && cursor.getUTCDay() === 0) break;
    }

    return { grid: weeks, monthPositions: positions, maxTokens: max };
  }, [data, targetYear]);

  function getColor(usage: DailyUsage | undefined, inYear: boolean): string {
    if (!inYear) return "transparent";
    if (!usage) return colors[0];
    const total = usage.inputTokens + usage.outputTokens;
    if (total === 0) return colors[0];
    if (maxTokens === 0) return colors[0];
    const ratio = total / maxTokens;
    if (ratio < 0.25) return colors[1];
    if (ratio < 0.5) return colors[2];
    if (ratio < 0.75) return colors[3];
    return colors[4];
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-3">
      <h3 className="mb-2 text-sm font-semibold text-card-foreground">Usage Heatmap — {targetYear}</h3>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="inline-block">
          <div className="flex text-xs text-muted-foreground" style={{ marginLeft: 32 }}>
            {monthPositions.map(({ month, weekIdx }) => (
              <span
                key={month}
                style={{ position: "relative", left: weekIdx * 14 - (monthPositions[0]?.weekIdx ?? 0) * 14 }}
                className="absolute"
              >
                {MONTH_LABELS[month]}
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-0.5">
            <div className="flex flex-col gap-0.5 pr-1 text-xs text-muted-foreground">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-[10px] items-center text-[9px]">
                  {label}
                </div>
              ))}
            </div>
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="h-[10px] w-[10px] rounded-sm"
                    style={{ backgroundColor: getColor(day.usage, day.inYear) }}
                    title={
                      day.inYear && day.usage
                        ? `${day.date}: ${formatTokens(day.usage.inputTokens + day.usage.outputTokens)} tokens, ${formatCost(day.usage.cost)}`
                        : day.inYear
                          ? `${day.date}: no usage`
                          : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
