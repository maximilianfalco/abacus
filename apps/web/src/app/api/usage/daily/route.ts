import { NextRequest, NextResponse } from "next/server";
import { readAll, groupByDay, type DateRange } from "@abacus/parser";
import { getConfig } from "@/app/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const config = getConfig();

  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const project = searchParams.get("project") ?? undefined;
  const model = searchParams.get("model") ?? undefined;

  let lines = await readAll(config.dataPath);

  if (project) lines = lines.filter((l) => l.project === project);
  if (model) lines = lines.filter((l) => l.model.includes(model));

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const range: DateRange = {
    from: from ? new Date(from) : thirtyDaysAgo,
    to: to ? new Date(to) : now,
  };

  const daily = groupByDay(lines, range);
  return NextResponse.json(daily);
}
