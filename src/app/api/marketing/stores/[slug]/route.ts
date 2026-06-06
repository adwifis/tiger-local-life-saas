import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { getMarketingStoreBySlug, updateMarketingStore } from "@/lib/marketing/service";

const updateStoreSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  city: z.string().min(1),
  district: z.string().optional(),
  businessArea: z.string().optional(),
  avgTicketCents: z.number().int().nonnegative().nullable().optional(),
  mainProducts: z.array(z.string().min(1)).default([]),
  sellingPoints: z.array(z.string().min(1)).default([]),
  targetAudience: z.string().optional(),
  brandTone: z.string().optional(),
  contactPhone: z.string().optional(),
  actorUserEmail: z.string().email().optional()
});

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const store = await getMarketingStoreBySlug(slug);

  if (!store) {
    return Response.json({ error: "STORE_NOT_FOUND" }, { status: 404 });
  }

  return Response.json({ store });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateStoreSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const store = await updateMarketingStore({
      storeSlug: slug,
      payload: {
        name: parsed.data.name,
        industry: parsed.data.industry,
        city: parsed.data.city,
        district: parsed.data.district,
        businessArea: parsed.data.businessArea,
        avgTicketCents: parsed.data.avgTicketCents,
        mainProducts: parsed.data.mainProducts,
        sellingPoints: parsed.data.sellingPoints,
        targetAudience: parsed.data.targetAudience,
        brandTone: parsed.data.brandTone,
        contactPhone: parsed.data.contactPhone
      },
      actorUserEmail: parsed.data.actorUserEmail
    });

    return Response.json({ store });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "STORE_NOT_FOUND" ? 404 : 500;

    return Response.json({ error: message }, { status });
  }
}
