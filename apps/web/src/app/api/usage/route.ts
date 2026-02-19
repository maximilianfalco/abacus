import { NextRequest, NextResponse } from "next/server";
import { summarize, type DateRange } from "@abacus/parser";
import { getCachedLines } from "@/app/lib/cache";

function parseDateRange(
  dateRange?: string,
  from?: string,
  to?: string,
): DateRange | undefined {
  if (from || to) {
    return {
      from: from ? new Date(from) : new Date(0),
      to: to ? new Date(to) : new Date(),
    };
  }
  if (!dateRange) return undefined;

  const now = new Date();
  const days =
    dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - days);
  return { from: fromDate, to: now };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const dateRange = searchParams.get("dateRange") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const project = searchParams.get("project") ?? undefined;
  const model = searchParams.get("model") ?? undefined;

  let lines = await getCachedLines();

  if (project) lines = lines.filter((l) => l.project === project);
  if (model) lines = lines.filter((l) => l.model.includes(model));

  const range = parseDateRange(dateRange, from, to);
  const summary = summarize(lines, range);

  return NextResponse.json(summary);
}
