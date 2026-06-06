import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { createAgentMerchantStore } from "@/lib/marketing/service";

const createAgentMerchantSchema = z.object({
  agentId: z.string().min(1),
  createdByUserEmail: z.string().email().optional(),
  name: z.string().min(1),
  industry: z.string().min(1),
  city: z.string().min(1),
  district: z.string().optional(),
  businessArea: z.string().optional(),
  targetAudience: z.string().optional(),
  brandTone: z.string().optional(),
  contactPhone: z.string().optional(),
  mainProducts: z.array(z.string().min(1)).default([]),
  sellingPoints: z.array(z.string().min(1)).default([])
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createAgentMerchantSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const merchant = await createAgentMerchantStore({
      agentId: parsed.data.agentId,
      createdByUserEmail: parsed.data.createdByUserEmail,
      payload: {
        name: parsed.data.name,
        industry: parsed.data.industry,
        city: parsed.data.city,
        district: parsed.data.district,
        businessArea: parsed.data.businessArea,
        targetAudience: parsed.data.targetAudience,
        brandTone: parsed.data.brandTone,
        contactPhone: parsed.data.contactPhone,
        mainProducts: parsed.data.mainProducts,
        sellingPoints: parsed.data.sellingPoints
      }
    });

    return Response.json({ merchant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "AGENT_NOT_FOUND" ? 404 : 500;

    return Response.json({ error: message }, { status });
  }
}
