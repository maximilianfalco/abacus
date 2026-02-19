import { NextResponse } from "next/server";
import { groupBySession } from "@abacus/parser";
import { getCachedLines } from "@/app/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const lines = await getCachedLines();
  const sessions = groupBySession(lines);

  // Only sessions with activity in the last 30 minutes
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const active = sessions
    .filter((s) => s.endedAt >= cutoff)
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt));

  return NextResponse.json(active);
}
