import OpenAI from "openai";
import { AiProvider, ExecutionMode, MarketingGenerationStatus, MarketingProvisionRequestStatus, MarketingTemplateStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

function getExecutionMode() {
  return process.env.AI_EXECUTION_MODE === "live" && process.env.BAILIAN_API_KEY
    ? ExecutionMode.LIVE
    : ExecutionMode.DRY_RUN;
}

function getOpenAiClient() {
  return new OpenAI({
    apiKey: process.env.BAILIAN_API_KEY,
    baseURL: process.env.BAILIAN_BASE_URL
  });
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function slugifyStoreName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  const base = normalized || `store-${Date.now()}`;

  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

async function recordMarketingOperation(params: {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetLabel: string;
  detail?: string;
  storeId?: string | null;
  agentId?: string | null;
  planId?: string | null;
  templateId?: string | null;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;

  await client.marketingOperationLog.create({
    data: {
      actorUserId: params.actorUserId || null,
      action: params.action,
      targetType: params.targetType,
      targetLabel: params.targetLabel,
      detail: params.detail,
      storeId: params.storeId || null,
      agentId: params.agentId || null,
      planId: params.planId || null,
      templateId: params.templateId || null,
      metadata: params.metadata
    }
  });
}

function buildPrompt(params: {
  store: {
    name: string;
    industry: string;
    city: string;
    district: string | null;
    businessArea: string | null;
    targetAudience: string | null;
    brandTone: string | null;
    mainProducts: unknown;
    sellingPoints: unknown;
  };
  template: {
    name: string;
    scene: string;
    platform: string;
    promptTemplate: unknown;
  };
  inputs: Record<string, unknown>;
}) {
  const promptTemplate = params.template.promptTemplate as {
    system?: string;
    outputFormat?: string[];
    callToActionRule?: string;
  };

  return {
    system:
      promptTemplate.system ||
      "你是中国本地生活行业营销顾问，输出中文内容，具体、可信、可直接发布，不要解释。",
    user: [
      `门店名称：${params.store.name}`,
      `行业：${params.store.industry}`,
      `城市：${params.store.city}`,
      `区域：${params.store.district || "-"} / ${params.store.businessArea || "-"}`,
      `客群：${params.store.targetAudience || "-"}`,
      `品牌语气：${params.store.brandTone || "-"}`,
      `主推项目：${JSON.stringify(params.store.mainProducts || [])}`,
      `核心卖点：${JSON.stringify(params.store.sellingPoints || [])}`,
      `模板：${params.template.name}`,
      `场景：${params.template.scene}`,
      `平台：${params.template.platform}`,
      `业务输入：${JSON.stringify(params.inputs, null, 2)}`,
      `输出结构：${JSON.stringify(promptTemplate.outputFormat || ["标题", "正文", "行动引导"])}`,
      `行动引导规则：${promptTemplate.callToActionRule || "结尾要有到店或咨询引导。"}`
    ].join("\n")
  };
}

function buildDryRunOutput(params: {
  storeName: string;
  templateName: string;
  scene: string;
  platform: string;
  inputs: Record<string, unknown>;
}) {
  const inputText = Object.entries(params.inputs)
    .map(([key, value]) => `${key}：${String(value)}`)
    .join("；");

  return [
    `【${params.templateName}】`,
    `今天给大家整理一版适合 ${params.storeName} 的 ${params.platform} 内容，重点围绕 ${params.scene} 来做转化。`,
    `这次核心信息是：${inputText || "按门店默认卖点生成"}。`,
    "文案会强调门店亮点、适合人群、限时利益点和到店理由，方便继续联调页面和额度逻辑。",
    "现在可直接继续接入百炼真实输出。"
  ].join("\n");
}

export async function listMarketingTemplates() {
  return prisma.marketingTemplate.findMany({
    where: {
      status: "ACTIVE"
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      category: true
    }
  });
}

export async function getMarketingTemplateBySlug(templateSlug: string) {
  const template = await prisma.marketingTemplate.findUnique({
    where: {
      slug: templateSlug
    },
    include: {
      category: true,
      _count: {
        select: {
          generations: true
        }
      }
    }
  });

  if (!template) {
    return null;
  }

  const promptTemplate = (template.promptTemplate || {}) as {
    system?: string;
    outputFormat?: string[];
    callToActionRule?: string;
  };

  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    categoryName: template.category.name,
    industry: template.industry,
    scene: template.scene,
    platform: template.platform,
    description: template.description,
    sortOrder: template.sortOrder,
    status: template.status,
    inputSchema: template.inputSchema,
    generationCount: template._count.generations,
    promptTemplate: {
      system: promptTemplate.system || "",
      outputFormat: Array.isArray(promptTemplate.outputFormat) ? promptTemplate.outputFormat.join("\n") : "",
      callToActionRule: promptTemplate.callToActionRule || ""
    }
  };
}

export async function updateMarketingTemplate(params: {
  templateSlug: string;
  payload: {
    description: string;
    sortOrder: number;
    status: MarketingTemplateStatus;
    promptSystem: string;
    outputFormat: string[];
    callToActionRule: string;
  };
  actorUserEmail?: string;
}) {
  const [existingTemplate, actorUser] = await Promise.all([
    prisma.marketingTemplate.findUnique({
      where: {
        slug: params.templateSlug
      }
    }),
    params.actorUserEmail ? prisma.user.findUnique({ where: { email: params.actorUserEmail } }) : Promise.resolve(null)
  ]);

  if (!existingTemplate) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const template = await prisma.marketingTemplate.update({
    where: {
      slug: params.templateSlug
    },
    data: {
      description: params.payload.description,
      sortOrder: params.payload.sortOrder,
      status: params.payload.status,
      promptTemplate: {
        system: params.payload.promptSystem,
        outputFormat: params.payload.outputFormat,
        callToActionRule: params.payload.callToActionRule
      }
    }
  });

  await recordMarketingOperation({
    actorUserId: actorUser?.id,
    action: "template.updated",
    targetType: "template",
    targetLabel: template.name,
    templateId: template.id,
    detail: `更新模板状态为 ${template.status}，排序 ${template.sortOrder}。`,
    metadata: {
      templateSlug: template.slug,
      status: template.status,
      sortOrder: template.sortOrder
    }
  });

  return {
    id: template.id,
    slug: template.slug,
    status: template.status
  };
}

export async function listMarketingStores() {
  const stores = await prisma.storeProfile.findMany({
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
      },
      agentLinks: true
    }
  });

  return stores.map((store) => {
    const quota = store.quotas[0] || null;

    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      industry: store.industry,
      city: store.city,
      district: store.district,
      businessArea: store.businessArea,
      targetAudience: store.targetAudience,
      brandTone: store.brandTone,
      remainingQuota: quota ? Math.max(quota.monthlyLimit - quota.usedCount, 0) : 0,
      monthlyLimit: quota?.monthlyLimit || 0,
      usedCount: quota?.usedCount || 0,
      hasAgent: store.agentLinks.length > 0
    };
  });
}

export async function getMarketingStoreBySlug(storeSlug: string) {
  const store = await prisma.storeProfile.findUnique({
    where: {
      slug: storeSlug
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
      },
      subscriptions: {
        orderBy: {
          updatedAt: "desc"
        },
        take: 3,
        include: {
          plan: true
        }
      }
    }
  });

  if (!store) {
    return null;
  }

  const quota = store.quotas[0] || null;

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    industry: store.industry,
    city: store.city,
    district: store.district,
    businessArea: store.businessArea,
    avgTicketCents: store.avgTicketCents,
    targetAudience: store.targetAudience,
    brandTone: store.brandTone,
    contactPhone: store.contactPhone,
    mainProducts: asStringArray(store.mainProducts),
    sellingPoints: asStringArray(store.sellingPoints),
    remainingQuota: quota ? Math.max(quota.monthlyLimit - quota.usedCount, 0) : 0,
    monthlyLimit: quota?.monthlyLimit || 0,
    subscriptions: store.subscriptions.map((subscription) => ({
      id: subscription.id,
      status: subscription.status,
      startAt: subscription.startAt.toISOString().slice(0, 10),
      endAt: subscription.endAt.toISOString().slice(0, 10),
      planName: subscription.plan.name
    }))
  };
}

export async function updateMarketingStore(params: {
  storeSlug: string;
  payload: {
    name: string;
    industry: string;
    city: string;
    district?: string | null;
    businessArea?: string | null;
    avgTicketCents?: number | null;
    mainProducts: string[];
    sellingPoints: string[];
    targetAudience?: string | null;
    brandTone?: string | null;
    contactPhone?: string | null;
  };
  actorUserEmail?: string;
}) {
  const [existingStore, actorUser] = await Promise.all([
    prisma.storeProfile.findUnique({
      where: {
        slug: params.storeSlug
      }
    }),
    params.actorUserEmail ? prisma.user.findUnique({ where: { email: params.actorUserEmail } }) : Promise.resolve(null)
  ]);

  if (!existingStore) {
    throw new Error("STORE_NOT_FOUND");
  }

  const store = await prisma.storeProfile.update({
    where: {
      slug: params.storeSlug
    },
    data: {
      name: params.payload.name,
      industry: params.payload.industry,
      city: params.payload.city,
      district: params.payload.district || null,
      businessArea: params.payload.businessArea || null,
      avgTicketCents: params.payload.avgTicketCents ?? null,
      mainProducts: params.payload.mainProducts,
      sellingPoints: params.payload.sellingPoints,
      targetAudience: params.payload.targetAudience || null,
      brandTone: params.payload.brandTone || null,
      contactPhone: params.payload.contactPhone || null
    }
  });

  await recordMarketingOperation({
    actorUserId: actorUser?.id,
    action: "store.updated",
    targetType: "store",
    targetLabel: store.name,
    storeId: store.id,
    detail: `更新门店资料：${store.city} · ${store.industry}。`,
    metadata: {
      storeSlug: store.slug,
      city: store.city,
      industry: store.industry
    }
  });

  return {
    id: store.id,
    slug: store.slug,
    name: store.name
  };
}

export async function listMarketingPlans() {
  return prisma.marketingPlan.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      priceCents: "asc"
    }
  });
}

export async function getMarketingPlanByCode(planCode: string) {
  const plan = await prisma.marketingPlan.findUnique({
    where: {
      code: planCode
    },
    include: {
      _count: {
        select: {
          subscriptions: true
        }
      }
    }
  });

  if (!plan) {
    return null;
  }

  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    roleScope: plan.roleScope,
    monthlyQuota: plan.monthlyQuota,
    priceCents: plan.priceCents,
    isActive: plan.isActive,
    subscriptionCount: plan._count.subscriptions,
    createdAt: plan.createdAt.toISOString().slice(0, 10),
    updatedAt: plan.updatedAt.toISOString().slice(0, 16).replace("T", " ")
  };
}

export async function updateMarketingPlan(params: {
  planCode: string;
  payload: {
    name: string;
    roleScope: "MERCHANT" | "AGENT";
    monthlyQuota: number;
    priceCents: number;
    isActive: boolean;
  };
  actorUserEmail?: string;
}) {
  const [existingPlan, actorUser] = await Promise.all([
    prisma.marketingPlan.findUnique({
      where: {
        code: params.planCode
      }
    }),
    params.actorUserEmail ? prisma.user.findUnique({ where: { email: params.actorUserEmail } }) : Promise.resolve(null)
  ]);

  if (!existingPlan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  const plan = await prisma.marketingPlan.update({
    where: {
      code: params.planCode
    },
    data: {
      name: params.payload.name,
      roleScope: params.payload.roleScope,
      monthlyQuota: params.payload.monthlyQuota,
      priceCents: params.payload.priceCents,
      isActive: params.payload.isActive
    }
  });

  await recordMarketingOperation({
    actorUserId: actorUser?.id,
    action: "plan.updated",
    targetType: "plan",
    targetLabel: plan.name,
    planId: plan.id,
    detail: `套餐调整为 ${plan.monthlyQuota} 次 / 月，价格 ${plan.priceCents} 分，${plan.isActive ? "启用" : "停用"}。`,
    metadata: {
      planCode: plan.code,
      roleScope: plan.roleScope,
      monthlyQuota: plan.monthlyQuota,
      priceCents: plan.priceCents,
      isActive: plan.isActive
    }
  });

  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    isActive: plan.isActive
  };
}

export async function openMarketingSubscription(params: {
  storeSlug: string;
  planCode: string;
  openedByAdminEmail?: string;
  months?: number;
}) {
  const [store, plan, adminUser] = await Promise.all([
    prisma.storeProfile.findUnique({
      where: {
        slug: params.storeSlug
      }
    }),
    prisma.marketingPlan.findUnique({
      where: {
        code: params.planCode
      }
    }),
    prisma.user.findUnique({
      where: {
        email: params.openedByAdminEmail || "admin@quoteai.local"
      }
    })
  ]);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  const months = Math.max(1, params.months || 1);
  const startAt = new Date();
  const endAt = new Date(startAt);
  endAt.setMonth(endAt.getMonth() + months);

  return prisma.$transaction(async (tx) => {
    await tx.marketingSubscription.updateMany({
      where: {
        storeId: store.id,
        status: "ACTIVE"
      },
      data: {
        status: "SUPERSEDED"
      }
    });

    const subscription = await tx.marketingSubscription.create({
      data: {
        storeId: store.id,
        planId: plan.id,
        status: "ACTIVE",
        sourceType: "MANUAL",
        startAt,
        endAt,
        openedByAdminId: adminUser?.id
      },
      include: {
        plan: true,
        store: true
      }
    });

    const existingQuota = await tx.marketingQuota.findFirst({
      where: {
        storeId: store.id,
        status: "ACTIVE"
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const quota = existingQuota
      ? await tx.marketingQuota.update({
          where: {
            id: existingQuota.id
          },
          data: {
            monthlyLimit: plan.monthlyQuota,
            usedCount: 0,
            resetAt: endAt,
            status: "ACTIVE"
          }
        })
      : await tx.marketingQuota.create({
          data: {
            storeId: store.id,
            monthlyLimit: plan.monthlyQuota,
            usedCount: 0,
            resetAt: endAt,
            status: "ACTIVE"
          }
        });

    await recordMarketingOperation({
      actorUserId: adminUser?.id,
      action: "subscription.opened",
      targetType: "subscription",
      targetLabel: `${store.name} · ${plan.name}`,
      storeId: store.id,
      planId: plan.id,
      detail: `手工开通 ${months} 个月，到期 ${subscription.endAt.toISOString().slice(0, 10)}。`,
      metadata: {
        storeSlug: store.slug,
        planCode: plan.code,
        months,
        endAt: subscription.endAt.toISOString()
      },
      tx
    });

    return {
      subscription: {
        id: subscription.id,
        storeName: subscription.store?.name || store.name,
        planName: subscription.plan.name,
        endAt: subscription.endAt.toISOString().slice(0, 10),
        status: subscription.status
      },
      quota: {
        monthlyLimit: quota.monthlyLimit,
        usedCount: quota.usedCount,
        remainingCount: Math.max(quota.monthlyLimit - quota.usedCount, 0)
      }
    };
  });
}

export async function createMarketingProvisionRequest(params: {
  storeSlug: string;
  planCode: string;
  months?: number;
  note?: string;
  requestedByUserEmail?: string;
}) {
  const [store, plan, requestedByUser] = await Promise.all([
    prisma.storeProfile.findUnique({ where: { slug: params.storeSlug }, include: { agentLinks: { take: 1 } } }),
    prisma.marketingPlan.findUnique({ where: { code: params.planCode } }),
    params.requestedByUserEmail ? prisma.user.findUnique({ where: { email: params.requestedByUserEmail } }) : Promise.resolve(null)
  ]);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  const months = Math.max(1, params.months || 1);
  const agentLink = store.agentLinks[0] || null;

  const request = await prisma.marketingProvisionRequest.create({
    data: {
      storeId: store.id,
      agentId: agentLink?.agentId || null,
      planId: plan.id,
      months,
      note: params.note || null,
      requestedByUserId: requestedByUser?.id
    },
    include: {
      store: true,
      plan: true
    }
  });

  await recordMarketingOperation({
    actorUserId: requestedByUser?.id,
    action: "provision.request_created",
    targetType: "provision_request",
    targetLabel: `${request.store.name} · ${request.plan.name}`,
    storeId: request.storeId,
    agentId: request.agentId,
    planId: request.planId,
    detail: `代理提交开通申请 ${months} 个月。`,
    metadata: {
      storeSlug: request.store.slug,
      planCode: request.plan.code,
      months,
      note: request.note
    }
  });

  return {
    id: request.id,
    storeName: request.store.name,
    planName: request.plan.name,
    status: request.status
  };
}

export async function reviewMarketingProvisionRequest(params: {
  requestId: string;
  decision: "APPROVE" | "REJECT";
  reviewedByAdminEmail?: string;
}) {
  const [request, adminUser] = await Promise.all([
    prisma.marketingProvisionRequest.findUnique({
      where: { id: params.requestId },
      include: {
        store: true,
        plan: true
      }
    }),
    prisma.user.findUnique({
      where: { email: params.reviewedByAdminEmail || "admin@quoteai.local" }
    })
  ]);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  if (request.status !== MarketingProvisionRequestStatus.PENDING) {
    throw new Error("REQUEST_NOT_PENDING");
  }

  if (params.decision === "REJECT") {
    const rejected = await prisma.marketingProvisionRequest.update({
      where: { id: request.id },
      data: {
        status: MarketingProvisionRequestStatus.REJECTED,
        reviewedByAdminId: adminUser?.id,
        reviewedAt: new Date()
      }
    });

    await recordMarketingOperation({
      actorUserId: adminUser?.id,
      action: "provision.request_rejected",
      targetType: "provision_request",
      targetLabel: `${request.store.name} · ${request.plan.name}`,
      storeId: request.storeId,
      agentId: request.agentId,
      planId: request.planId,
      detail: "平台驳回了套餐开通申请。",
      metadata: {
        requestId: rejected.id
      }
    });

    return { requestId: rejected.id, status: rejected.status };
  }

  const opened = await openMarketingSubscription({
    storeSlug: request.store.slug,
    planCode: request.plan.code,
    openedByAdminEmail: params.reviewedByAdminEmail,
    months: request.months
  });

  const approved = await prisma.marketingProvisionRequest.update({
    where: { id: request.id },
    data: {
      status: MarketingProvisionRequestStatus.APPROVED,
      reviewedByAdminId: adminUser?.id,
      reviewedAt: new Date()
    }
  });

  await recordMarketingOperation({
    actorUserId: adminUser?.id,
    action: "provision.request_approved",
    targetType: "provision_request",
    targetLabel: `${request.store.name} · ${request.plan.name}`,
    storeId: request.storeId,
    agentId: request.agentId,
    planId: request.planId,
    detail: `平台审核通过，并开通 ${request.months} 个月。`,
    metadata: {
      requestId: approved.id
    }
  });

  return {
    requestId: approved.id,
    status: approved.status,
    subscription: opened.subscription
  };
}

export async function createAgentMerchantStore(params: {
  agentId: string;
  payload: {
    name: string;
    industry: string;
    city: string;
    district?: string | null;
    businessArea?: string | null;
    targetAudience?: string | null;
    brandTone?: string | null;
    contactPhone?: string | null;
    mainProducts: string[];
    sellingPoints: string[];
  };
  createdByUserEmail?: string;
}) {
  const [agent, createdByUser] = await Promise.all([
    prisma.agentProfile.findUnique({
      where: {
        id: params.agentId
      }
    }),
    params.createdByUserEmail ? prisma.user.findUnique({ where: { email: params.createdByUserEmail } }) : Promise.resolve(null)
  ]);

  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  const slug = slugifyStoreName(params.payload.name);

  return prisma.$transaction(async (tx) => {
    const store = await tx.storeProfile.create({
      data: {
        ownerUserId: createdByUser?.id,
        name: params.payload.name,
        slug,
        industry: params.payload.industry,
        city: params.payload.city,
        district: params.payload.district || null,
        businessArea: params.payload.businessArea || null,
        targetAudience: params.payload.targetAudience || null,
        brandTone: params.payload.brandTone || null,
        contactPhone: params.payload.contactPhone || null,
        mainProducts: params.payload.mainProducts,
        sellingPoints: params.payload.sellingPoints
      }
    });

    await tx.agentMerchant.create({
      data: {
        agentId: agent.id,
        storeId: store.id,
        serviceStatus: "ACTIVE",
        notes: "代理后台新建客户门店"
      }
    });

    await recordMarketingOperation({
      actorUserId: createdByUser?.id,
      action: "agent.merchant_created",
      targetType: "store",
      targetLabel: store.name,
      storeId: store.id,
      agentId: agent.id,
      detail: `代理新增客户门店：${store.city} · ${store.industry}。`,
      metadata: {
        storeSlug: store.slug,
        companyName: agent.companyName
      },
      tx
    });

    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      city: store.city,
      industry: store.industry
    };
  });
}

async function claimStoreQuota(storeId: string) {
  const quota = await prisma.marketingQuota.findFirst({
    where: {
      storeId,
      status: "ACTIVE"
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (!quota) {
    throw new Error("QUOTA_NOT_CONFIGURED");
  }

  if (quota.usedCount >= quota.monthlyLimit) {
    throw new Error("QUOTA_EXCEEDED");
  }

  return quota;
}

export async function createMarketingGeneration(params: {
  storeSlug: string;
  templateSlug: string;
  inputs: Record<string, unknown>;
  createdByUserEmail?: string;
}) {
  const [store, template, createdByUser] = await Promise.all([
    prisma.storeProfile.findUnique({ where: { slug: params.storeSlug } }),
    prisma.marketingTemplate.findUnique({ where: { slug: params.templateSlug } }),
    params.createdByUserEmail
      ? prisma.user.findUnique({ where: { email: params.createdByUserEmail } })
      : Promise.resolve(null)
  ]);

  const inputPayload = params.inputs as Prisma.InputJsonValue;

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  if (!template) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const executionMode = getExecutionMode();
  const prompt = buildPrompt({
    store: {
      name: store.name,
      industry: store.industry,
      city: store.city,
      district: store.district,
      businessArea: store.businessArea,
      targetAudience: store.targetAudience,
      brandTone: store.brandTone,
      mainProducts: store.mainProducts,
      sellingPoints: store.sellingPoints
    },
    template: {
      name: template.name,
      scene: template.scene,
      platform: template.platform,
      promptTemplate: template.promptTemplate
    },
    inputs: params.inputs
  });

  const startedAt = Date.now();
  const quota = await claimStoreQuota(store.id);

  if (executionMode === ExecutionMode.DRY_RUN) {
    const outputText = buildDryRunOutput({
      storeName: store.name,
      templateName: template.name,
      scene: template.scene,
      platform: template.platform,
      inputs: params.inputs
    });

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.marketingGenerationRecord.create({
        data: {
          storeId: store.id,
          templateId: template.id,
          createdByUserId: createdByUser?.id,
          title: `${store.name} - ${template.name}`,
          inputPayload,
          outputText,
          outputJson: {
            system: prompt.system,
            user: prompt.user
          },
          provider: AiProvider.BAILIAN,
          model: process.env.BAILIAN_DAILY_MODEL || "qwen3.6-plus",
          executionMode,
          status: MarketingGenerationStatus.DRY_RUN,
          latencyMs: Date.now() - startedAt
        }
      });

      const nextQuota = await tx.marketingQuota.update({
        where: { id: quota.id },
        data: {
          usedCount: {
            increment: 1
          }
        }
      });

      return {
        record,
        quota: {
          monthlyLimit: nextQuota.monthlyLimit,
          usedCount: nextQuota.usedCount,
          remainingCount: Math.max(nextQuota.monthlyLimit - nextQuota.usedCount, 0)
        }
      };
    });

    return result;
  }

  const client = getOpenAiClient();

  try {
    const response = await client.chat.completions.create({
      model: process.env.BAILIAN_DAILY_MODEL || "qwen3.6-plus",
      temperature: 0.8,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });

    const outputText = response.choices[0]?.message?.content?.trim() || "";
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.marketingGenerationRecord.create({
        data: {
          storeId: store.id,
          templateId: template.id,
          createdByUserId: createdByUser?.id,
          title: `${store.name} - ${template.name}`,
          inputPayload,
          outputText,
          outputJson: response as unknown as object,
          provider: AiProvider.BAILIAN,
          model: response.model,
          executionMode,
          status: MarketingGenerationStatus.SUCCEEDED,
          latencyMs: Date.now() - startedAt,
          tokensInput: response.usage?.prompt_tokens,
          tokensOutput: response.usage?.completion_tokens
        }
      });

      await tx.aiCallLog.create({
        data: {
          provider: AiProvider.BAILIAN,
          model: response.model,
          executionMode,
          latencyMs: Date.now() - startedAt,
          tokensInput: response.usage?.prompt_tokens,
          tokensOutput: response.usage?.completion_tokens,
          requestBody: {
            system: prompt.system,
            user: prompt.user
          },
          responseBody: response as unknown as object
        }
      });

      const nextQuota = await tx.marketingQuota.update({
        where: { id: quota.id },
        data: {
          usedCount: {
            increment: 1
          }
        }
      });

      return {
        record,
        quota: {
          monthlyLimit: nextQuota.monthlyLimit,
          usedCount: nextQuota.usedCount,
          remainingCount: Math.max(nextQuota.monthlyLimit - nextQuota.usedCount, 0)
        }
      };
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_BAILIAN_ERROR";

    const record = await prisma.marketingGenerationRecord.create({
      data: {
        storeId: store.id,
        templateId: template.id,
        createdByUserId: createdByUser?.id,
        title: `${store.name} - ${template.name}`,
        inputPayload,
        outputText: "",
        provider: AiProvider.BAILIAN,
        model: process.env.BAILIAN_DAILY_MODEL || "qwen3.6-plus",
        executionMode,
        status: MarketingGenerationStatus.FAILED,
        errorMessage: message,
        latencyMs: Date.now() - startedAt
      }
    });

    await prisma.aiCallLog.create({
      data: {
        provider: AiProvider.BAILIAN,
        model: process.env.BAILIAN_DAILY_MODEL || "qwen3.6-plus",
        executionMode,
        latencyMs: Date.now() - startedAt,
        requestBody: {
          system: prompt.system,
          user: prompt.user
        },
        errorMessage: message
      }
    });

    return {
      record,
      quota: {
        monthlyLimit: quota.monthlyLimit,
        usedCount: quota.usedCount,
        remainingCount: Math.max(quota.monthlyLimit - quota.usedCount, 0)
      }
    };
  }
}
