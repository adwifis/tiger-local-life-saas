import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { getMarketingTemplateBySlug, updateMarketingTemplate } from "@/lib/marketing/service";

const updateTemplateSchema = z.object({
  description: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  status: z.enum(["ACTIVE", "DRAFT", "DISABLED"]),
  promptSystem: z.string().min(1),
  outputFormat: z.array(z.string().min(1)).min(1),
  callToActionRule: z.string().min(1),
  actorUserEmail: z.string().email().optional()
});

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const template = await getMarketingTemplateBySlug(slug);

  if (!template) {
    return Response.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
  }

  return Response.json({ template });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const template = await updateMarketingTemplate({
      templateSlug: slug,
      payload: {
        description: parsed.data.description,
        sortOrder: parsed.data.sortOrder,
        status: parsed.data.status,
        promptSystem: parsed.data.promptSystem,
        outputFormat: parsed.data.outputFormat,
        callToActionRule: parsed.data.callToActionRule
      },
      actorUserEmail: parsed.data.actorUserEmail
    });

    return Response.json({ template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "TEMPLATE_NOT_FOUND" ? 404 : 500;

    return Response.json({ error: message }, { status });
  }
}
