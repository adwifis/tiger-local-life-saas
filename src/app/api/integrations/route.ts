import { NextResponse } from "next/server";
import { getStarterDashboard } from "@/lib/starter-data";

export async function GET() {
  const dashboard = await getStarterDashboard();

  return NextResponse.json({
    data: dashboard.integrations
  });
}
