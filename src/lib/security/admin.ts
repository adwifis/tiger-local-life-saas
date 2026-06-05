import { NextRequest, NextResponse } from "next/server";

export function requireAdmin(request: NextRequest) {
  if (process.env.APP_ENV !== "production") {
    return null;
  }

  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    return NextResponse.json(
      {
        error: "ADMIN_API_KEY is not configured.",
        code: "ADMIN_API_KEY_MISSING"
      },
      { status: 500 }
    );
  }

  if (request.headers.get("x-admin-api-key") !== expected) {
    return NextResponse.json(
      {
        error: "Unauthorized admin API request.",
        code: "UNAUTHORIZED_ADMIN_API"
      },
      { status: 401 }
    );
  }

  return null;
}
