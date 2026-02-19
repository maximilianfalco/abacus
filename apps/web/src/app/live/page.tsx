"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { ParsedSession } from "@abacus/parser";
import { formatTokens, formatCost, formatDuration } from "@abacus/ui";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<ParsedSession[]>;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-card-foreground">{value}</p>
    </div>
  );
}

function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums">{formatDuration(startedAt, now)}</span>;
}

function SessionCard({ session, isLatest }: { session: ParsedSession; isLatest: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-card-foreground">{session.project}</p>
          <p className="text-xs text-muted-foreground">{session.model}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLatest && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            <ElapsedTime startedAt={session.startedAt} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Input" value={formatTokens(session.inputTokens)} />
        <Stat label="Output" value={formatTokens(session.outputTokens)} />
        <Stat label="Messages" value={String(session.messageCount)} />
        <Stat label="Cost" value={formatCost(session.cost)} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="truncate font-mono">{session.sessionId.slice(0, 8)}</span>
        <span>
          {new Date(session.startedAt).toLocaleTimeString()} — {new Date(session.endedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default function LivePage() {
  const { data: sessions, isLoading } = useSWR<ParsedSession[]>(
    "/api/sessions/live",
    fetcher,
    { refreshInterval: 2000 },
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading live sessions...
        </div>
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium text-foreground">No active sessions</p>
        <p className="text-sm text-muted-foreground">
          Start a Claude Code session to see live token usage
        </p>
      </div>
    );
  }

  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const totalInput = sessions.reduce((sum, s) => sum + s.inputTokens, 0);
  const totalOutput = sessions.reduce((sum, s) => sum + s.outputTokens, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Live Sessions</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{sessions.length} session{sessions.length !== 1 && "s"} today</span>
          <span>{formatTokens(totalInput + totalOutput)} tokens</span>
          <span>{formatCost(totalCost)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session, i) => (
          <SessionCard key={session.sessionId} session={session} isLatest={i === 0} />
        ))}
      </div>
    </div>
  );
}
