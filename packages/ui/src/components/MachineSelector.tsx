"use client";

import { useState } from "react";

export interface MachineSelectorProps {
  machines: Array<{
    id: string;
    name: string;
    lastSyncAt: string;
  }>;
  selectedMachineId: string | "all";
  onSelect: (machineId: string | "all") => void;
}

function syncStatusColor(lastSyncAt: string): string {
  const elapsed = Date.now() - new Date(lastSyncAt).getTime();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;
  if (elapsed < ONE_HOUR) return "bg-emerald-500";
  if (elapsed < ONE_DAY) return "bg-yellow-500";
  return "bg-red-500";
}

export function MachineSelector({ machines, selectedMachineId, onSelect }: MachineSelectorProps) {
  const [open, setOpen] = useState(false);

  if (machines.length <= 1) return null;

  const selected = selectedMachineId === "all"
    ? "All Machines"
    : machines.find((m) => m.id === selectedMachineId)?.name ?? "Unknown";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-accent"
      >
        <span>{selected}</span>
        <span className="text-xs text-muted-foreground">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-lg">
          <button
            onClick={() => { onSelect("all"); setOpen(false); }}
            className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
              selectedMachineId === "all" ? "bg-accent" : ""
            }`}
          >
            All Machines
          </button>
          {machines.map((m) => (
            <button
              key={m.id}
              onClick={() => { onSelect(m.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
                selectedMachineId === m.id ? "bg-accent" : ""
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${syncStatusColor(m.lastSyncAt)}`} />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
