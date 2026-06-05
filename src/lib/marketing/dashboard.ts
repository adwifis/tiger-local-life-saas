import { prisma } from "@/lib/db";

export async function getMarketingDashboard() {
  const [storeCount, templateCount, generationCount, quota, stores, templates, generations] = await Promise.all([
    prisma.storeProfile.count(),
    prisma.marketingTemplate.count({
      where: {
        status: "ACTIVE"
      }
    }),
    prisma.marketingGenerationRecord.count(),
    prisma.marketingQuota.findFirst({
      orderBy: {
        updatedAt: "desc"
      }
    }),
    prisma.storeProfile.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      take: 3
    }),
    prisma.marketingTemplate.findMany({
      where: {
        status: "ACTIVE"
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 12
    }),
    prisma.marketingGenerationRecord.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 6,
      include: {
        store: true,
        template: true
      }
    })
  ]);

  return {
    stats: [
      { label: "门店", value: String(storeCount), note: "演示商家档案" },
      { label: "模板", value: String(templateCount), note: "已落库营销模板" },
      { label: "生成记录", value: String(generationCount), note: "可继续联调额度逻辑" },
      {
        label: "剩余额度",
        value: quota ? String(Math.max(quota.monthlyLimit - quota.usedCount, 0)) : "0",
        note: quota ? `本月上限 ${quota.monthlyLimit}` : "待配置"
      }
    ],
    stores: stores.map((store) => ({
      id: store.id,
      slug: store.slug,
      name: store.name,
      industry: store.industry,
      city: store.city,
      businessArea: store.businessArea,
      targetAudience: store.targetAudience
    })),
    templates: templates.map((template) => ({
      id: template.id,
      slug: template.slug,
      name: template.name,
      scene: template.scene,
      platform: template.platform,
      description: template.description
    })),
    generations: generations.map((item) => ({
      id: item.id,
      title: item.title,
      storeName: item.store.name,
      templateName: item.template.name,
      status: item.status,
      model: item.model,
      createdAt: item.createdAt.toISOString().slice(0, 16).replace("T", " ")
    }))
  };
}
