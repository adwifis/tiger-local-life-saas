import { NextRequest, NextResponse } from "next/server";
import { buildAssetKey, getStorageStatus } from "@/lib/storage/oss";
import { asNonEmptyString, badRequest } from "@/lib/http/validation";
import { requireAdmin } from "@/lib/security/admin";

export async function GET() {
  const storage = getStorageStatus();

  return NextResponse.json({
    data: storage,
    note: storage.configured
      ? "OSS/COS compatible storage variables are configured and ready for the next project."
      : "Storage template is preserved. No bucket write will happen until the next project enables it."
  });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as {
    scopeId?: string;
    fileName?: string;
    contentType?: string;
    purpose?: string;
  } | null;

  const scopeId = asNonEmptyString(body?.scopeId);
  const fileName = asNonEmptyString(body?.fileName);
  const contentType = asNonEmptyString(body?.contentType) || "application/octet-stream";
  const purpose = asNonEmptyString(body?.purpose) || "next-project-asset";

  if (!scopeId || !fileName) {
    return badRequest("Missing required fields: scopeId, fileName");
  }

  const storage = getStorageStatus();

  return NextResponse.json(
    {
      data: {
        scopeId,
        key: buildAssetKey({ merchantId: scopeId, fileName }),
        contentType,
        purpose,
        uploadMode: storage.configured ? "pending-presign-implementation" : "dry-run",
        storage
      },
      note: "This route is preserved only as a reusable asset-registration starter for the next project."
    },
    { status: 201 }
  );
}
