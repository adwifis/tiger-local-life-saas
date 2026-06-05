import { listMarketingStores } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const stores = await listMarketingStores();

  return Response.json({
    stores: stores.map((store) => ({
      id: store.id,
      slug: store.slug,
      name: store.name,
      industry: store.industry,
      city: store.city,
      district: store.district,
      businessArea: store.businessArea,
      targetAudience: store.targetAudience,
      brandTone: store.brandTone
    }))
  });
}
