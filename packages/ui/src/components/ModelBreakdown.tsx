"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ModelUsage } from "@abacus/parser";
import { MODEL_COLORS } from "../lib/colors.js";
import { formatTokens, formatCost } from "../lib/format.js";

export interface ModelBreakdownProps {
  data: ModelUsage[];
  metric?: "tokens" | "cost";
}

export function ModelBreakdown({ data, metric: initialMetric = "tokens" }: ModelBreakdownProps) {
  const [metric, setMetric] = useState(initialMetric);

  const chartData = data.map((m) => ({
    name: m.model,
    value: metric === "tokens" ? m.inputTokens + m.outputTokens : m.cost,
    inputTokens: m.inputTokens,
    outputTokens: m.outputTokens,
    cost: m.cost,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">By Model</h3>
        <div className="flex gap-1">
          {(["tokens", "cost"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                metric === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {m === "tokens" ? "Tokens" : "Cost"}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name.replace("claude-", "")} ${(percent * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={MODEL_COLORS[entry.name] ?? "#888"} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof chartData)[0];
              return (
                <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-md">
                  <p className="font-medium text-popover-foreground">{d.name}</p>
                  <p>Input: {formatTokens(d.inputTokens)}</p>
                  <p>Output: {formatTokens(d.outputTokens)}</p>
                  <p>Cost: {formatCost(d.cost)}</p>
                  <p className="text-xs text-muted-foreground">
                    {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              );
            }}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-card-foreground text-lg font-semibold"
          >
            {metric === "tokens" ? formatTokens(total) : formatCost(total)}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
