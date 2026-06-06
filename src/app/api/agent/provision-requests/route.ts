import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { createMarketingProvisionRequest } from "@/lib/marketing/service";

const createProvisionRequestSchema = z.object({
  storeSlug: z.string().min(1),
  planCode: z.string().min(1),
  months: z.number().int().positive().max(12).optional(),
  note: z.string().optional(),
  requestedByUserEmail: z.string().email().optional()
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createProvisionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const provisionRequest = await createMarketingProvisionRequest(parsed.data);

    return Response.json({ provisionRequest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "STORE_NOT_FOUND" || message === "PLAN_NOT_FOUND" ? 404 : 500;

    return Response.json({ error: message }, { status });
  }
}
