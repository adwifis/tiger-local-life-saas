import "dotenv/config";

import { PrismaClient, TemplateStatus, UserRole, UsageLedgerType, CompanyStatus, MarketingTemplateStatus, PlanScope } from "@prisma/client";
import { createHash } from "node:crypto";

import { quoteTemplates } from "../src/lib/quoteai/templates";
import { marketingTemplates } from "../src/lib/marketing/templates";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

async function seedWorkspace() {
  await prisma.workspace.upsert({
    where: { id: "starter_workspace" },
    update: {
      name: "QuoteAI Workspace",
      note: "老虎AI方案报价助手开发骨架与演示数据。"
    },
    create: {
      id: "starter_workspace",
      name: "QuoteAI Workspace",
      note: "老虎AI方案报价助手开发骨架与演示数据。"
    }
  });
}

async function seedTemplates() {
  for (const template of quoteTemplates) {
    await prisma.industryTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        targetUser: template.targetUser,
        category: template.category,
        description: template.description,
        status: TemplateStatus.ACTIVE,
        isFeatured: true,
        sortOrder: template.sortOrder,
        formSchema: template.formSchema,
        defaultLineItems: template.defaultLineItems,
        sectionSchema: template.sectionSchema,
        promptConfig: template.promptConfig,
        riskDisclosures: template.riskDisclosures
      },
      create: {
        code: template.code,
        name: template.name,
        targetUser: template.targetUser,
        category: template.category,
        description: template.description,
        status: TemplateStatus.ACTIVE,
        isFeatured: true,
        sortOrder: template.sortOrder,
        formSchema: template.formSchema,
        defaultLineItems: template.defaultLineItems,
        sectionSchema: template.sectionSchema,
        promptConfig: template.promptConfig,
        riskDisclosures: template.riskDisclosures
      }
    });
  }
}

async function seedMarketingTemplates() {
  for (const template of marketingTemplates) {
    const category = await prisma.marketingTemplateCategory.upsert({
      where: { slug: template.category.slug },
      update: {
        name: template.category.name,
        industry: template.category.industry,
        scene: template.category.scene,
        platform: template.category.platform,
        sortOrder: template.category.sortOrder,
        isActive: true
      },
      create: {
        name: template.category.name,
        slug: template.category.slug,
        industry: template.category.industry,
        scene: template.category.scene,
        platform: template.category.platform,
        sortOrder: template.category.sortOrder,
        isActive: true
      }
    });

    await prisma.marketingTemplate.upsert({
      where: { slug: template.slug },
      update: {
        categoryId: category.id,
        name: template.name,
        industry: template.industry,
        scene: template.scene,
        platform: template.platform,
        description: template.description,
        inputSchema: template.inputSchema,
        promptTemplate: template.promptTemplate,
        exampleOutput: template.exampleOutput,
        isFeatured: true,
        sortOrder: template.sortOrder,
        status: MarketingTemplateStatus.ACTIVE
      },
      create: {
        categoryId: category.id,
        name: template.name,
        slug: template.slug,
        industry: template.industry,
        scene: template.scene,
        platform: template.platform,
        description: template.description,
        inputSchema: template.inputSchema,
        promptTemplate: template.promptTemplate,
        exampleOutput: template.exampleOutput,
        isFeatured: true,
        sortOrder: template.sortOrder,
        status: MarketingTemplateStatus.ACTIVE
      }
    });
  }
}

async function seedAccounts() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@quoteai.local" },
    update: {
      name: "QuoteAI Admin",
      role: UserRole.ADMIN,
      passwordHash: hashPassword("quoteai-admin-demo")
    },
    create: {
      email: "admin@quoteai.local",
      name: "QuoteAI Admin",
      role: UserRole.ADMIN,
      passwordHash: hashPassword("quoteai-admin-demo")
    }
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@quoteai.local" },
    update: {
      name: "深圳城市代理",
      role: UserRole.AGENT,
      passwordHash: hashPassword("quoteai-agent-demo")
    },
    create: {
      email: "agent@quoteai.local",
      name: "深圳城市代理",
      role: UserRole.AGENT,
      passwordHash: hashPassword("quoteai-agent-demo")
    }
  });

  const company = await prisma.company.upsert({
    where: { slug: "demo-design-studio" },
    update: {
      name: "示例装修设计工作室",
      status: CompanyStatus.TRIAL,
      ownerId: admin.id,
      agentId: agent.id,
      usageBalance: 30,
      brandColor: "#2f6fed",
      contactName: "王总",
      contactPhone: "13800000000",
      contactEmail: "demo@quoteai.local",
      brandProfile: {
        companyName: "示例装修设计工作室",
        slogan: "更快出方案，更稳签合同"
      }
    },
    create: {
      slug: "demo-design-studio",
      name: "示例装修设计工作室",
      status: CompanyStatus.TRIAL,
      ownerId: admin.id,
      agentId: agent.id,
      usageBalance: 30,
      brandColor: "#2f6fed",
      contactName: "王总",
      contactPhone: "13800000000",
      contactEmail: "demo@quoteai.local",
      brandProfile: {
        companyName: "示例装修设计工作室",
        slogan: "更快出方案，更稳签合同"
      }
    }
  });

  await prisma.user.upsert({
    where: { email: "demo@quoteai.local" },
    update: {
      name: "演示账号",
      role: UserRole.MEMBER,
      isDemo: true,
      companyId: company.id,
      passwordHash: hashPassword("quoteai-demo-user")
    },
    create: {
      email: "demo@quoteai.local",
      name: "演示账号",
      role: UserRole.MEMBER,
      isDemo: true,
      companyId: company.id,
      passwordHash: hashPassword("quoteai-demo-user")
    }
  });

  const existingTrialGrant = await prisma.usageLedger.findFirst({
    where: {
      companyId: company.id,
      type: UsageLedgerType.TRIAL_GRANT,
      note: "初始化演示额度"
    }
  });

  if (!existingTrialGrant) {
    await prisma.usageLedger.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        type: UsageLedgerType.TRIAL_GRANT,
        delta: 30,
        balanceAfter: 30,
        note: "初始化演示额度",
        metadata: {
          source: "seed"
        }
      }
    });
  }

  const renovationTemplate = quoteTemplates.find((item) => item.code === "renovation_design");

  if (!renovationTemplate) {
    return;
  }

  const templateRecord = await prisma.industryTemplate.findUnique({
    where: {
      code: renovationTemplate.code
    }
  });

  if (!templateRecord) {
    return;
  }

  const existingQuote = await prisma.quote.findFirst({
    where: {
      companyId: company.id,
      title: "南山壹号 128㎡ 全案整装报价方案"
    }
  });

  const lineItems = renovationTemplate.defaultLineItems.map((item, index) => {
    const subtotalCents = Math.round(item.defaultQuantity * item.defaultUnitPriceCents);

    return {
      sortOrder: index + 1,
      name: item.name,
      description: item.description,
      unit: item.unit,
      quantity: item.defaultQuantity,
      unitPriceCents: item.defaultUnitPriceCents,
      discountCents: 0,
      subtotalCents
    };
  });

  const totalCents = lineItems.reduce((sum, item) => sum + item.subtotalCents, 0);

  const quotePayload = {
    companyId: company.id,
    templateId: templateRecord.id,
    createdById: admin.id,
    title: "南山壹号 128㎡ 全案整装报价方案",
    clientName: "李女士",
    contactName: "李女士",
    contactPhone: "13900000000",
    contactEmail: "li@example.local",
    status: "SHARED" as const,
    currency: "CNY",
    templateCodeSnapshot: renovationTemplate.code,
    templateNameSnapshot: renovationTemplate.name,
    templateSnapshot: renovationTemplate,
    clientContext: {
      budgetRange: "20-30 万",
      stylePreference: "现代简约",
      moveInDeadline: "2026-10"
    },
    formValues: {
      clientBackground: "改善型三口之家，关注收纳、环保和交付确定性。",
      houseArea: 128,
      layout: "3室2厅2卫",
      renovationType: "全案整装",
      style: "现代简约",
      deliveryCycle: 75,
      ecoRequirement: "高环保",
      includeSupervision: true
    },
    generatedSections: {
      overview: "本方案聚焦 128㎡ 改善型住宅的整装交付，强调环保材料、全屋收纳优化和按节点验收。",
      needs: "客户核心诉求是缩短沟通成本，确保儿童房环保标准和主卧收纳完整度。",
      schedule: "签约后 7 天内完成深化设计，75 天内完成主体交付，软装和定制柜体按现场进度穿插。 "
    },
    editableSections: {
      overview: "本方案聚焦 128㎡ 改善型住宅的整装交付，强调环保材料、全屋收纳优化和按节点验收。",
      needs: "客户核心诉求是缩短沟通成本，确保儿童房环保标准和主卧收纳完整度。",
      pricing: "报价分设计、基础施工、墙地面、定制四个模块，便于客户按阶段确认。",
      warranty: "基础工程质保 2 年，隐蔽工程按国家标准执行。"
    },
    shareEnabled: true,
    subtotalCents: totalCents,
    discountCents: 0,
    taxCents: 0,
    totalCents,
    lastGeneratedAt: new Date("2026-06-04T10:20:00.000Z"),
    lastViewedAt: new Date("2026-06-04T14:05:00.000Z"),
    viewCount: 3
  };

  let quoteId = existingQuote?.id;

  if (existingQuote) {
    await prisma.quote.update({
      where: { id: existingQuote.id },
      data: quotePayload
    });

    await prisma.quoteLineItem.deleteMany({
      where: {
        quoteId: existingQuote.id
      }
    });

    await prisma.quoteLineItem.createMany({
      data: lineItems.map((item) => ({
        ...item,
        quoteId: existingQuote.id
      }))
    });

    quoteId = existingQuote.id;
  } else {
    const createdQuote = await prisma.quote.create({
      data: {
        ...quotePayload,
        lineItems: {
          create: lineItems
        }
      }
    });

    quoteId = createdQuote.id;
  }

  if (!quoteId) {
    return;
  }

  const existingShare = await prisma.quoteShare.findFirst({
    where: {
      quoteId,
      token: "demo-share-quote-renovation"
    }
  });

  if (!existingShare) {
    await prisma.quoteShare.create({
      data: {
        quoteId,
        companyId: company.id,
        token: "demo-share-quote-renovation",
        isActive: true,
        allowPdfDownload: true,
        viewCount: 3,
        firstViewedAt: new Date("2026-06-04T11:00:00.000Z"),
        lastViewedAt: new Date("2026-06-04T14:05:00.000Z"),
        expiresAt: new Date("2026-06-30T00:00:00.000Z")
      }
    });
  }

  const existingGenerationLedger = await prisma.usageLedger.findFirst({
    where: {
      companyId: company.id,
      quoteId,
      type: UsageLedgerType.AI_GENERATION
    }
  });

  if (!existingGenerationLedger) {
    await prisma.usageLedger.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        quoteId,
        type: UsageLedgerType.AI_GENERATION,
        delta: -1,
        balanceAfter: 29,
        note: "演示报价生成扣减 1 次额度",
        metadata: {
          source: "seed",
          templateCode: renovationTemplate.code
        }
      }
    });
  }

  const store = await prisma.storeProfile.upsert({
    where: { slug: "nanshan-coffee-lab" },
    update: {
      ownerUserId: admin.id,
      name: "南山咖啡实验室",
      industry: "餐饮",
      city: "深圳",
      district: "南山",
      businessArea: "海岸城",
      avgTicketCents: 6800,
      mainProducts: ["手冲咖啡", "早午餐", "甜品"],
      sellingPoints: ["环境出片", "工作日安静", "周末 brunch"],
      targetAudience: "白领、情侣、周边居民",
      brandTone: "轻松亲切",
      contactPhone: "13600000000",
      status: CompanyStatus.TRIAL
    },
    create: {
      ownerUserId: admin.id,
      slug: "nanshan-coffee-lab",
      name: "南山咖啡实验室",
      industry: "餐饮",
      city: "深圳",
      district: "南山",
      businessArea: "海岸城",
      avgTicketCents: 6800,
      mainProducts: ["手冲咖啡", "早午餐", "甜品"],
      sellingPoints: ["环境出片", "工作日安静", "周末 brunch"],
      targetAudience: "白领、情侣、周边居民",
      brandTone: "轻松亲切",
      contactPhone: "13600000000",
      status: CompanyStatus.TRIAL
    }
  });

  const agentProfile = await prisma.agentProfile.upsert({
    where: { ownerUserId: agent.id },
    update: {
      companyName: "深圳本地生活代运营中心",
      contactName: "城市代理小林",
      contactPhone: "13700000000",
      level: "city",
      status: CompanyStatus.ACTIVE
    },
    create: {
      ownerUserId: agent.id,
      companyName: "深圳本地生活代运营中心",
      contactName: "城市代理小林",
      contactPhone: "13700000000",
      level: "city",
      status: CompanyStatus.ACTIVE
    }
  });

  await prisma.agentMerchant.upsert({
    where: {
      agentId_storeId: {
        agentId: agentProfile.id,
        storeId: store.id
      }
    },
    update: {
      serviceStatus: "ACTIVE",
      notes: "演示代理服务关系"
    },
    create: {
      agentId: agentProfile.id,
      storeId: store.id,
      serviceStatus: "ACTIVE",
      notes: "演示代理服务关系"
    }
  });

  const merchantPlan = await prisma.marketingPlan.upsert({
    where: { code: "merchant-basic" },
    update: {
      name: "商家基础版",
      roleScope: PlanScope.MERCHANT,
      monthlyQuota: 100,
      priceCents: 9900,
      isActive: true
    },
    create: {
      code: "merchant-basic",
      name: "商家基础版",
      roleScope: PlanScope.MERCHANT,
      monthlyQuota: 100,
      priceCents: 9900,
      isActive: true
    }
  });

  await prisma.marketingSubscription.upsert({
    where: { id: "marketing_sub_demo_store" },
    update: {
      storeId: store.id,
      planId: merchantPlan.id,
      status: "ACTIVE",
      sourceType: "MANUAL",
      startAt: new Date("2026-06-01T00:00:00.000Z"),
      endAt: new Date("2026-06-30T23:59:59.000Z"),
      openedByAdminId: admin.id
    },
    create: {
      id: "marketing_sub_demo_store",
      storeId: store.id,
      planId: merchantPlan.id,
      status: "ACTIVE",
      sourceType: "MANUAL",
      startAt: new Date("2026-06-01T00:00:00.000Z"),
      endAt: new Date("2026-06-30T23:59:59.000Z"),
      openedByAdminId: admin.id
    }
  });

  await prisma.marketingQuota.upsert({
    where: { id: "marketing_quota_demo_store" },
    update: {
      storeId: store.id,
      monthlyLimit: 100,
      usedCount: 6,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
      status: "ACTIVE"
    },
    create: {
      id: "marketing_quota_demo_store",
      storeId: store.id,
      monthlyLimit: 100,
      usedCount: 6,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
      status: "ACTIVE"
    }
  });
}

async function main() {
  await seedWorkspace();
  await seedTemplates();
  await seedMarketingTemplates();
  await seedAccounts();

  console.log("Seed complete: reference QuoteAI data plus marketing SaaS store, templates, agent, and plan are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
