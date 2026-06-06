import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { getMarketingPlanByCode, updateMarketingPlan } from "@/lib/marketing/service";

const updatePlanSchema = z.object({
  name: z.string().min(1),
  roleScope: z.enum(["MERCHANT", "AGENT"]),
  monthlyQuota: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  isActive: z.boolean(),
  actorUserEmail: z.string().email().optional()
});

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const plan = await getMarketingPlanByCode(code);

  if (!plan) {
    return Response.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  return Response.json({ plan });
}

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updatePlanSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const plan = await updateMarketingPlan({
      planCode: code,
      payload: {
        name: parsed.data.name,
        roleScope: parsed.data.roleScope,
        monthlyQuota: parsed.data.monthlyQuota,
        priceCents: parsed.data.priceCents,
        isActive: parsed.data.isActive
      },
      actorUserEmail: parsed.data.actorUserEmail
    });

    return Response.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "PLAN_NOT_FOUND" ? 404 : 500;

    return Response.json({ error: message }, { status });
  }
}
