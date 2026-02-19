"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyUsage } from "@abacus/parser";
import { TOKEN_COLORS } from "../lib/colors";
import { formatTokens, formatDate } from "../lib/format";

export interface DailyUsageChartProps {
  data: DailyUsage[];
  dateRange: "7d" | "30d" | "90d" | "custom";
  onDateRangeChange: (range: string, from?: string, to?: string) => void;
}

const RANGES = ["7d", "30d", "90d"] as const;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatTokens(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function DailyUsageChart({
  data,
  dateRange,
  onDateRangeChange,
}: DailyUsageChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">Daily Usage</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onDateRangeChange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                dateRange === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" className="text-xs" />
          <YAxis tickFormatter={formatTokens} className="text-xs" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="inputTokens" name="Input" stackId="tokens" fill={TOKEN_COLORS.input} />
          <Bar dataKey="outputTokens" name="Output" stackId="tokens" fill={TOKEN_COLORS.output} />
        </BarChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
