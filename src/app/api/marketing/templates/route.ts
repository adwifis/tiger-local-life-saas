import { listMarketingTemplates } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const templates = await listMarketingTemplates();

  return Response.json({
    templates: templates.map((template) => ({
      id: template.id,
      slug: template.slug,
      name: template.name,
      scene: template.scene,
      platform: template.platform,
      description: template.description,
      category: template.category.name,
      inputSchema: template.inputSchema
    }))
  });
}
