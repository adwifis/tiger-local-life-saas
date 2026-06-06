import { prisma } from "@/lib/db";

export async function getAgentWorkspace() {
  const agents = await prisma.agentProfile.findMany({
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      ownerUser: true,
      merchants: {
        include: {
          store: {
            include: {
              quotas: {
                where: {
                  status: "ACTIVE"
                },
                orderBy: {
                  updatedAt: "desc"
                },
                take: 1
              }
            }
          }
        }
      }
    }
  });

  return agents.map((agent) => ({
    id: agent.id,
    companyName: agent.companyName,
    contactName: agent.contactName || agent.ownerUser?.name || "-",
    status: agent.status,
    merchantCount: agent.merchants.length,
    merchants: agent.merchants.map((merchant) => {
      const quota = merchant.store.quotas[0] || null;

      return {
        id: merchant.id,
        storeName: merchant.store.name,
        city: merchant.store.city,
        industry: merchant.store.industry,
        serviceStatus: merchant.serviceStatus,
        remainingQuota: quota ? Math.max(quota.monthlyLimit - quota.usedCount, 0) : 0
      };
    })
  }));
}

export async function getAdminWorkspace() {
  const [stores, agents, plans, subscriptions, generations, templates] = await Promise.all([
    prisma.storeProfile.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        quotas: {
          where: {
            status: "ACTIVE"
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 1
        }
      },
      take: 8
    }),
    prisma.agentProfile.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        merchants: true
      },
      take: 8
    }),
    prisma.marketingPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        priceCents: "asc"
      }
    }),
    prisma.marketingSubscription.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        store: true,
        agent: true,
        plan: true
      },
      take: 8
    }),
    prisma.marketingGenerationRecord.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        store: true,
        template: true
      },
      take: 8
    }),
    prisma.marketingTemplate.findMany({
      where: {
        status: "ACTIVE"
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        category: true,
        _count: {
          select: {
            generations: true
          }
        }
      },
      take: 12
    })
  ]);

  return {
    stores: stores.map((store) => {
      const quota = store.quotas[0] || null;

      return {
        id: store.id,
        slug: store.slug,
        name: store.name,
        city: store.city,
        industry: store.industry,
        status: store.status,
        remainingQuota: quota ? Math.max(quota.monthlyLimit - quota.usedCount, 0) : 0
      };
    }),
    agents: agents.map((agent) => ({
      id: agent.id,
      companyName: agent.companyName,
      merchantCount: agent.merchants.length,
      status: agent.status
    })),
    plans: plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      code: plan.code,
      roleScope: plan.roleScope,
      monthlyQuota: plan.monthlyQuota,
      priceCents: plan.priceCents
    })),
    subscriptions: subscriptions.map((subscription) => ({
      id: subscription.id,
      planName: subscription.plan.name,
      targetName: subscription.store?.name || subscription.agent?.companyName || "-",
      status: subscription.status,
      endAt: subscription.endAt.toISOString().slice(0, 10)
    })),
    generations: generations.map((generation) => ({
      id: generation.id,
      storeName: generation.store.name,
      templateName: generation.template.name,
      status: generation.status,
      model: generation.model,
      createdAt: generation.createdAt.toISOString().slice(0, 16).replace("T", " ")
    })),
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      categoryName: template.category.name,
      industry: template.industry,
      scene: template.scene,
      platform: template.platform,
      fieldCount: Array.isArray(template.inputSchema) ? template.inputSchema.length : 0,
      generationCount: template._count.generations
    }))
  };
}
