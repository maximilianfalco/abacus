"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyUsage } from "@abacus/parser";
import { TOKEN_COLORS } from "../lib/colors";
import { formatTokens, formatCost, formatMonth, formatPercent } from "../lib/format";

export interface MonthlyUsageChartProps {
  data: MonthlyUsage[];
  showCostOverlay?: boolean;
  showComparison?: boolean;
}

export function MonthlyUsageChart({
  data,
  showCostOverlay = true,
  showComparison = true,
}: MonthlyUsageChartProps) {
  const chartData = data.map((d, i) => {
    const prev = i > 0 ? data[i - 1] : null;
    const prevTotal = prev ? prev.inputTokens + prev.outputTokens : 0;
    const currTotal = d.inputTokens + d.outputTokens;
    const change = prev && prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : null;

    return {
      ...d,
      label: formatMonth(d.month),
      change,
    };
  });

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Monthly Usage</h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" className="text-xs" />
          <YAxis tickFormatter={formatTokens} className="text-xs" />
          {showCostOverlay && (
            <YAxis yAxisId="cost" orientation="right" tickFormatter={formatCost} className="text-xs" />
          )}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0]?.payload as (typeof chartData)[0] | undefined;
              return (
                <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-md">
                  <p className="font-medium text-popover-foreground">{label}</p>
                  {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color as string }}>
                      {p.name}: {typeof p.value === "number" && p.name === "Cost" ? formatCost(p.value) : formatTokens(p.value as number)}
                    </p>
                  ))}
                  {showComparison && entry?.change !== null && entry?.change !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      vs prev month: {formatPercent(entry.change)}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Legend />
          <Bar dataKey="inputTokens" name="Input" stackId="tokens" fill={TOKEN_COLORS.input} />
          <Bar dataKey="outputTokens" name="Output" stackId="tokens" fill={TOKEN_COLORS.output} />
          {showCostOverlay && (
            <Line yAxisId="cost" dataKey="cost" name="Cost" stroke="#EF4444" dot type="monotone" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
