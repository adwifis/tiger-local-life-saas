import { NextResponse } from "next/server";

import { getQuoteAiDashboard } from "@/lib/quoteai/dashboard";

export async function GET() {
  const dashboard = await getQuoteAiDashboard();
  return NextResponse.json(dashboard);
}
