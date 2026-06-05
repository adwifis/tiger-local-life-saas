import { z } from "zod";

import { badRequest } from "@/lib/http/validation";
import { createMarketingGeneration } from "@/lib/marketing/service";

const generateSchema = z.object({
  storeSlug: z.string().min(1),
  templateSlug: z.string().min(1),
  inputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  createdByUserEmail: z.string().email().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((item) => item.message).join("; "));
  }

  try {
    const record = await createMarketingGeneration(parsed.data);

    return Response.json({
      id: record.id,
      title: record.title,
      status: record.status,
      model: record.model,
      executionMode: record.executionMode,
      outputText: record.outputText,
      errorMessage: record.errorMessage,
      createdAt: record.createdAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "STORE_NOT_FOUND" || message === "TEMPLATE_NOT_FOUND" ? 404 : 500;

    return Response.json(
      {
        error: message
      },
      { status }
    );
  }
}
