"use client";

import { useState } from "react";

export interface SyncStatusIndicatorProps {
  mode: "local" | "sender" | "receiver";
  lastSyncAt?: string;
  machines?: Array<{ name: string; lastSyncAt: string }>;
  onSyncNow?: () => void;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function dotColor(lastSyncAt: string | undefined): string {
  if (!lastSyncAt) return "bg-gray-400";
  const elapsed = Date.now() - new Date(lastSyncAt).getTime();
  if (elapsed < 60 * 60 * 1000) return "bg-emerald-500";
  if (elapsed < 24 * 60 * 60 * 1000) return "bg-yellow-500";
  return "bg-red-500";
}

export function SyncStatusIndicator({ mode, lastSyncAt, machines, onSyncNow }: SyncStatusIndicatorProps) {
  const [open, setOpen] = useState(false);

  const label =
    mode === "local"
      ? "Local Only"
      : mode === "sender"
        ? lastSyncAt
          ? `Synced ${timeAgo(lastSyncAt)}`
          : "Not synced"
        : `Receiving from ${machines?.length ?? 0} machine${(machines?.length ?? 0) !== 1 ? "s" : ""}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:bg-accent"
      >
        <span className={`h-2 w-2 rounded-full ${mode === "local" ? "bg-gray-400" : dotColor(lastSyncAt)}`} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[220px] rounded-md border border-border bg-popover p-3 text-sm shadow-lg">
          <p className="font-medium text-popover-foreground">
            Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </p>
          {lastSyncAt && (
            <p className="mt-1 text-xs text-muted-foreground">Last sync: {timeAgo(lastSyncAt)}</p>
          )}
          {mode === "receiver" && machines && machines.length > 0 && (
            <div className="mt-2 space-y-1">
              {machines.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${dotColor(m.lastSyncAt)}`} />
                  <span>{m.name}</span>
                  <span className="ml-auto text-muted-foreground">{timeAgo(m.lastSyncAt)}</span>
                </div>
              ))}
            </div>
          )}
          {mode === "sender" && onSyncNow && (
            <button
              onClick={() => { onSyncNow(); setOpen(false); }}
              className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
