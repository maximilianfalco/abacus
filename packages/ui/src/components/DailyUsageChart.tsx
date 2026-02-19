"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import type { DailyUsage } from "@abacus/parser";
import { TOKEN_COLORS } from "../lib/colors.js";
import { formatTokens, formatCost, formatDate } from "../lib/format.js";

export interface DailyUsageChartProps {
  data: DailyUsage[];
  dateRange: "7d" | "30d" | "90d" | "custom";
  onDateRangeChange: (range: string, from?: string, to?: string) => void;
  chartType?: "bar" | "line";
  showCost?: boolean;
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
  chartType = "bar",
  showCost = false,
}: DailyUsageChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  const Chart = chartType === "line" ? LineChart : BarChart;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Daily Usage</h3>
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
      <ResponsiveContainer width="100%" height={320}>
        <Chart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" className="text-xs" />
          <YAxis tickFormatter={formatTokens} className="text-xs" />
          {showCost && (
            <YAxis yAxisId="cost" orientation="right" tickFormatter={formatCost} className="text-xs" />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {chartType === "bar" ? (
            <>
              <Bar dataKey="inputTokens" name="Input" stackId="tokens" fill={TOKEN_COLORS.input} />
              <Bar dataKey="outputTokens" name="Output" stackId="tokens" fill={TOKEN_COLORS.output} />
              <Bar dataKey="cacheCreationTokens" name="Cache Write" stackId="tokens" fill={TOKEN_COLORS.cacheCreation} />
              <Bar dataKey="cacheReadTokens" name="Cache Read" stackId="tokens" fill={TOKEN_COLORS.cacheRead} />
            </>
          ) : (
            <>
              <Line dataKey="inputTokens" name="Input" stroke={TOKEN_COLORS.input} dot={false} />
              <Line dataKey="outputTokens" name="Output" stroke={TOKEN_COLORS.output} dot={false} />
              <Line dataKey="cacheCreationTokens" name="Cache Write" stroke={TOKEN_COLORS.cacheCreation} dot={false} />
              <Line dataKey="cacheReadTokens" name="Cache Read" stroke={TOKEN_COLORS.cacheRead} dot={false} />
            </>
          )}
          {showCost && (
            <Line yAxisId="cost" dataKey="cost" name="Cost" stroke="#EF4444" dot={false} strokeDasharray="5 5" />
          )}
          <Brush dataKey="label" height={30} stroke="#888" />
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
