"use client";

import { useState, useMemo } from "react";
import type { ParsedSession } from "@abacus/parser";
import { formatTokens, formatCost, formatDateFull, formatDuration } from "../lib/format.js";

export interface SessionTableProps {
  data: ParsedSession[];
  pageSize?: number;
  onSessionClick?: (sessionId: string) => void;
}

type SortKey = "project" | "startedAt" | "duration" | "inputTokens" | "outputTokens" | "model" | "cost";
type SortDir = "asc" | "desc";

function getDuration(s: ParsedSession): number {
  return new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
}

export function SessionTable({ data, pageSize = 20, onSessionClick }: SessionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    return data.toSorted((a: ParsedSession, b: ParsedSession) => {
      let cmp = 0;
      switch (sortKey) {
        case "project": cmp = a.project.localeCompare(b.project); break;
        case "startedAt": cmp = a.startedAt.localeCompare(b.startedAt); break;
        case "duration": cmp = getDuration(a) - getDuration(b); break;
        case "inputTokens": cmp = a.inputTokens - b.inputTokens; break;
        case "outputTokens": cmp = a.outputTokens - b.outputTokens; break;
        case "model": cmp = a.model.localeCompare(b.model); break;
        case "cost": cmp = a.cost - b.cost; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    const arrow = sortKey === field ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
    return (
      <th
        className="cursor-pointer select-none px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => handleSort(field)}
      >
        {label}{arrow}
      </th>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Session</th>
              <SortHeader label="Project" field="project" />
              <SortHeader label="Started" field="startedAt" />
              <SortHeader label="Duration" field="duration" />
              <SortHeader label="Input" field="inputTokens" />
              <SortHeader label="Output" field="outputTokens" />
              <SortHeader label="Model" field="model" />
              <SortHeader label="Cost" field="cost" />
            </tr>
          </thead>
          <tbody>
            {paged.map((s: ParsedSession) => (
              <tr
                key={s.sessionId}
                className="border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => onSessionClick?.(s.sessionId)}
              >
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {s.sessionId.slice(0, 8)}
                </td>
                <td className="px-3 py-2">{s.project}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDateFull(s.startedAt)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDuration(s.startedAt, s.endedAt)}</td>
                <td className="px-3 py-2 tabular-nums">{formatTokens(s.inputTokens)}</td>
                <td className="px-3 py-2 tabular-nums">{formatTokens(s.outputTokens)}</td>
                <td className="px-3 py-2">{s.model.replace("claude-", "")}</td>
                <td className="px-3 py-2 tabular-nums">{formatCost(s.cost)}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  No sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
