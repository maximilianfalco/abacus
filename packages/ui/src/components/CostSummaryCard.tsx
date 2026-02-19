"use client";

import { formatTokens, formatCost, formatPercent, percentChange } from "../lib/format.js";
import { COMPARISON_COLORS } from "../lib/colors.js";

interface PeriodData {
  tokens: number;
  cost: number;
}

export interface CostSummaryCardProps {
  current: {
    today: PeriodData;
    thisWeek: PeriodData;
    thisMonth: PeriodData;
    allTime: PeriodData;
  };
  previous?: {
    yesterday: PeriodData;
    lastWeek: PeriodData;
    lastMonth: PeriodData;
  };
}

function ComparisonBadge({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined) return null;
  const pct = percentChange(current, previous);
  if (pct === null) return null;

  const isUp = pct > 0;
  const color = isUp ? COMPARISON_COLORS.positive : COMPARISON_COLORS.negative;
  const arrow = isUp ? "\u2191" : "\u2193";

  return (
    <span className="text-xs font-medium" style={{ color }}>
      {arrow} {formatPercent(pct)}
    </span>
  );
}

function StatCard({
  label,
  tokens,
  cost,
  previousTokens,
}: {
  label: string;
  tokens: number;
  cost: number;
  previousTokens?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-card-foreground">
        {formatTokens(tokens)}
      </p>
      <p className="text-sm text-muted-foreground">{formatCost(cost)}</p>
      <div className="mt-2">
        <ComparisonBadge current={tokens} previous={previousTokens} />
      </div>
    </div>
  );
}

export function CostSummaryCard({ current, previous }: CostSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Today"
        tokens={current.today.tokens}
        cost={current.today.cost}
        previousTokens={previous?.yesterday.tokens}
      />
      <StatCard
        label="This Week"
        tokens={current.thisWeek.tokens}
        cost={current.thisWeek.cost}
        previousTokens={previous?.lastWeek.tokens}
      />
      <StatCard
        label="This Month"
        tokens={current.thisMonth.tokens}
        cost={current.thisMonth.cost}
        previousTokens={previous?.lastMonth.tokens}
      />
      <StatCard label="All Time" tokens={current.allTime.tokens} cost={current.allTime.cost} />
    </div>
  );
}
