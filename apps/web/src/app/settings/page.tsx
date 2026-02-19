"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Monitor, Sun, Moon } from "lucide-react";

const jsonFetcher = (url: string) => fetch(url).then((r) => r.json());

interface SyncStatus {
  mode: string;
  machines: Array<{ id: string; name: string; lastSyncAt: string }>;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: syncStatus } = useSWR<SyncStatus>(
    "/api/sync/status",
    jsonFetcher,
  );

  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Appearance
        </h2>
        {mounted && (
          <div className="flex gap-2">
            {(
              [
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Data Source
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-card-foreground">
              JSONL Data Path
            </label>
            <p className="mt-1 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
              {process.env.NEXT_PUBLIC_CLAUDE_DATA_PATH || "~/.claude/projects"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set via CLAUDE_DATA_PATH environment variable
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">Sync</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-card-foreground">
              Mode
            </label>
            <p className="mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {syncStatus?.mode ?? "local"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set via APP_MODE environment variable (local | sender | receiver)
            </p>
          </div>
          {syncStatus?.machines && syncStatus.machines.length > 0 && (
            <div>
              <label className="text-sm font-medium text-card-foreground">
                Connected Machines
              </label>
              <div className="mt-1 space-y-1">
                {syncStatus.machines.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm"
                  >
                    <span>{m.name}</span>
                    <span className="text-muted-foreground">
                      Last sync: {new Date(m.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">About</h2>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Abacus v0.1.0</p>
          <p>Local-first dashboard for Claude Code token usage analytics</p>
        </div>
      </section>
    </div>
  );
}
