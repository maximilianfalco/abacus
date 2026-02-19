import { NextRequest, NextResponse } from "next/server";
import { readAll, groupBySession } from "@abacus/parser";
import { getConfig } from "@/app/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const config = getConfig();

  const project = searchParams.get("project") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  let lines = await readAll(config.dataPath);

  if (project) lines = lines.filter((l) => l.project === project);
  if (model) lines = lines.filter((l) => l.model.includes(model));
  if (from) lines = lines.filter((l) => l.timestamp >= from);
  if (to) lines = lines.filter((l) => l.timestamp <= to);

  const sessions = groupBySession(lines);
  return NextResponse.json(sessions);
}
