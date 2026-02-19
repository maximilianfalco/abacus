import { NextRequest, NextResponse } from "next/server";
import { readAll, groupByMonth, type DateRange } from "@abacus/parser";
import { getConfig } from "@/app/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const config = getConfig();

  const project = searchParams.get("project") ?? undefined;
  const model = searchParams.get("model") ?? undefined;

  let lines = await readAll(config.dataPath);

  if (project) lines = lines.filter((l) => l.project === project);
  if (model) lines = lines.filter((l) => l.model.includes(model));

  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const range: DateRange = { from: twelveMonthsAgo, to: now };
  const monthly = groupByMonth(lines, range);

  return NextResponse.json(monthly);
}
