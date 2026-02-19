"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyUsage } from "@abacus/parser";
import { TOKEN_COLORS } from "../lib/colors.js";
import { formatTokens, formatCost, formatDate } from "../lib/format.js";

export interface CacheTokensChartProps {
  data: DailyUsage[];
  showSavings?: boolean;
  dateRange?: "7d" | "30d" | "90d";
}

const INPUT_PRICE_PER_TOKEN = 15 / 1_000_000;
const CACHE_READ_PRICE_PER_TOKEN = 1.5 / 1_000_000;

export function CacheTokensChart({ data, showSavings = true }: CacheTokensChartProps) {
  const chartData = data.map((d) => {
    const totalInput = d.inputTokens + d.cacheReadTokens;
    const hitRatio = totalInput > 0 ? (d.cacheReadTokens / totalInput) * 100 : 0;
    const savings = d.cacheReadTokens * (INPUT_PRICE_PER_TOKEN - CACHE_READ_PRICE_PER_TOKEN);
    return {
      label: formatDate(d.date),
      freshInput: d.inputTokens,
      cacheRead: d.cacheReadTokens,
      hitRatio: Math.round(hitRatio * 10) / 10,
      savings,
    };
  });

  const totalSavings = chartData.reduce((sum, d) => sum + d.savings, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Cache Analysis</h3>
        {showSavings && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Saved {formatCost(totalSavings)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" className="text-xs" />
          <YAxis tickFormatter={formatTokens} className="text-xs" />
          <YAxis yAxisId="ratio" orientation="right" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} className="text-xs" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof chartData)[0];
              return (
                <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-md">
                  <p className="font-medium text-popover-foreground">{d.label}</p>
                  <p style={{ color: TOKEN_COLORS.input }}>Fresh input: {formatTokens(d.freshInput)}</p>
                  <p style={{ color: TOKEN_COLORS.cacheRead }}>Cache read: {formatTokens(d.cacheRead)}</p>
                  <p>Hit ratio: {d.hitRatio}%</p>
                  {showSavings && <p className="text-emerald-600">Saved: {formatCost(d.savings)}</p>}
                </div>
              );
            }}
          />
          <Legend />
          <Area dataKey="freshInput" name="Fresh Input" fill={TOKEN_COLORS.input} fillOpacity={0.3} stroke={TOKEN_COLORS.input} />
          <Area dataKey="cacheRead" name="Cache Read" fill={TOKEN_COLORS.cacheRead} fillOpacity={0.3} stroke={TOKEN_COLORS.cacheRead} />
          <Line yAxisId="ratio" dataKey="hitRatio" name="Hit Ratio %" stroke="#10B981" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
