import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { reviewMarketingProvisionRequest } from "@/lib/marketing/service";

const reviewProvisionRequestSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reviewedByAdminEmail: z.string().email().optional()
});

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = reviewProvisionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const provisionRequest = await reviewMarketingProvisionRequest({
      requestId: id,
      decision: parsed.data.decision,
      reviewedByAdminEmail: parsed.data.reviewedByAdminEmail
    });

    return Response.json({ provisionRequest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = ["REQUEST_NOT_FOUND"].includes(message) ? 404 : 500;

    return Response.json({ error: message }, { status });
  }
}
