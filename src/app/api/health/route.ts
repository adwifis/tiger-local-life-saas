import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "tiger-local-life-saas",
    project: "虎鲸本地生活商家营销助手",
    timestamp: new Date().toISOString()
  });
}
