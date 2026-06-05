import { quoteTemplates } from "@/lib/quoteai/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    templates: quoteTemplates.map((template) => ({
      code: template.code,
      name: template.name,
      category: template.category,
      targetUser: template.targetUser,
      description: template.description,
      formSchema: template.formSchema,
      defaultLineItems: template.defaultLineItems,
      sectionSchema: template.sectionSchema,
      promptVersion: template.promptConfig.promptVersion,
      riskDisclosures: template.riskDisclosures
    }))
  });
}
