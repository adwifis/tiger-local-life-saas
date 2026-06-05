import { NextResponse } from "next/server";
import { getStorageStatus } from "@/lib/storage/oss";

export async function GET() {
  const storage = getStorageStatus();

  return NextResponse.json({
    data: {
      appEnv: process.env.APP_ENV || process.env.NODE_ENV || "development",
      aiExecutionMode: process.env.AI_EXECUTION_MODE || "dry-run",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      redisConfigured: Boolean(process.env.REDIS_URL),
      bailianConfigured: Boolean(process.env.BAILIAN_API_KEY),
      storage
    },
    storage: "config",
    note: "当前只保留环境和基础能力状态，不再包含原项目业务用量。"
  });
}
