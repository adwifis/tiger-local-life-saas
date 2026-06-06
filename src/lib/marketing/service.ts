import OpenAI from "openai";
import { AiProvider, ExecutionMode, MarketingGenerationStatus, MarketingTemplateStatus, Prisma } from "@prisma/client";

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
}) {
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
}) {
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
