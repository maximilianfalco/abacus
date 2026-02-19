import { NextResponse } from "next/server";
import { getConfig } from "@/app/lib/config";

export async function GET() {
  const config = getConfig();

  return NextResponse.json({
    mode: config.mode,
    machines: [],
  });
}
