import OpenAI from "openai";
import { AiProvider, ExecutionMode, MarketingGenerationStatus, Prisma } from "@prisma/client";

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

export async function listMarketingStores() {
  return prisma.storeProfile.findMany({
    orderBy: {
      updatedAt: "desc"
    }
  });
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

  if (executionMode === ExecutionMode.DRY_RUN) {
    const outputText = buildDryRunOutput({
      storeName: store.name,
      templateName: template.name,
      scene: template.scene,
      platform: template.platform,
      inputs: params.inputs
    });

    const record = await prisma.marketingGenerationRecord.create({
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

    return record;
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
    const record = await prisma.marketingGenerationRecord.create({
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

    await prisma.aiCallLog.create({
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

    return record;
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

    return record;
  }
}
