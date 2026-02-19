"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ProjectUsage } from "@abacus/parser";
import { formatTokens, formatCost } from "../lib/format.js";

export interface ProjectBreakdownProps {
  data: ProjectUsage[];
  limit?: number;
  onProjectClick?: (projectName: string) => void;
}

const BAR_GRADIENT = ["#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#EF4444", "#F97316", "#F59E0B"];

export function ProjectBreakdown({ data, limit = 10, onProjectClick }: ProjectBreakdownProps) {
  const sorted = data
    .toSorted((a: ProjectUsage, b: ProjectUsage) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens))
    .slice(0, limit);

  const chartData = sorted.map((p: ProjectUsage) => ({
    name: p.projectName,
    tokens: p.inputTokens + p.outputTokens,
    cost: p.cost,
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Projects</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40 + 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tickFormatter={formatTokens} className="text-xs" />
          <YAxis type="category" dataKey="name" width={80} className="text-xs" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof chartData)[0];
              return (
                <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-md">
                  <p className="font-medium text-popover-foreground">{d.name}</p>
                  <p>Tokens: {formatTokens(d.tokens)}</p>
                  <p>Cost: {formatCost(d.cost)}</p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="tokens"
            radius={[0, 4, 4, 0]}
            onClick={(d) => onProjectClick?.(d.name)}
            className="cursor-pointer"
          >
            {chartData.map((_: (typeof chartData)[0], i: number) => (
              <Cell key={i} fill={BAR_GRADIENT[i % BAR_GRADIENT.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
