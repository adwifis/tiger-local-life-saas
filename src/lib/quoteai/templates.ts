export type QuoteFieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "single_select"
  | "multi_select"
  | "boolean";

export type QuoteTemplateField = {
  id: string;
  label: string;
  type: QuoteFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string | number | boolean | string[];
  helpText?: string;
};

export type QuoteTemplateSection = {
  id: string;
  title: string;
  allowAi: boolean;
  editable: boolean;
  visibleByDefault: boolean;
};

export type QuoteTemplatePromptConfig = {
  promptVersion: string;
  systemPrompt: string;
  userPromptChecklist: string[];
  outputSchemaVersion: string;
};

export type QuoteTemplateRiskDisclosure = {
  title: string;
  items: string[];
};

export type QuoteTemplateLineItem = {
  name: string;
  unit: string;
  defaultQuantity: number;
  defaultUnitPriceCents: number;
  description?: string;
};

export type QuoteTemplateDefinition = {
  code: string;
  name: string;
  category: string;
  targetUser: string;
  description: string;
  sortOrder: number;
  formSchema: QuoteTemplateField[];
  defaultLineItems: QuoteTemplateLineItem[];
  sectionSchema: QuoteTemplateSection[];
  promptConfig: QuoteTemplatePromptConfig;
  riskDisclosures: QuoteTemplateRiskDisclosure[];
};

export const quoteTemplates: QuoteTemplateDefinition[] = [
  {
    code: "renovation_design",
    name: "装修设计",
    category: "装修设计",
    targetUser: "装修公司、设计工作室、工长",
    description: "适用于整装、半包和空间设计报价。",
    sortOrder: 10,
    formSchema: [
      { id: "clientBackground", label: "客户背景", type: "textarea", required: true, placeholder: "客户房屋情况、家庭结构、核心关注点" },
      { id: "houseArea", label: "房屋面积(m²)", type: "number", required: true, defaultValue: 120 },
      { id: "layout", label: "户型", type: "text", required: true, placeholder: "如：3室2厅2卫" },
      { id: "renovationType", label: "装修类型", type: "single_select", required: true, options: ["全案整装", "半包", "设计服务"], defaultValue: "全案整装" },
      { id: "style", label: "装修风格", type: "single_select", required: true, options: ["现代简约", "轻奢", "奶油风", "新中式", "原木风"] },
      { id: "deliveryCycle", label: "工期(天)", type: "number", required: true, defaultValue: 75 },
      { id: "ecoRequirement", label: "环保要求", type: "single_select", options: ["标准", "高环保", "母婴级"] },
      { id: "includeSupervision", label: "是否含监理", type: "boolean", defaultValue: true }
    ],
    defaultLineItems: [
      { name: "设计费", unit: "项", defaultQuantity: 1, defaultUnitPriceCents: 800000, description: "平面、立面、效果图与交底" },
      { name: "水电改造", unit: "项", defaultQuantity: 1, defaultUnitPriceCents: 1200000 },
      { name: "墙面处理", unit: "m²", defaultQuantity: 120, defaultUnitPriceCents: 3800 },
      { name: "地面铺设", unit: "m²", defaultQuantity: 85, defaultUnitPriceCents: 16800 },
      { name: "定制柜体", unit: "延米", defaultQuantity: 16, defaultUnitPriceCents: 180000 }
    ],
    sectionSchema: [
      { id: "overview", title: "项目概述", allowAi: true, editable: true, visibleByDefault: true },
      { id: "needs", title: "客户需求理解", allowAi: true, editable: true, visibleByDefault: true },
      { id: "spacePlanning", title: "空间规划建议", allowAi: true, editable: true, visibleByDefault: true },
      { id: "construction", title: "施工与材料标准", allowAi: true, editable: true, visibleByDefault: true },
      { id: "pricing", title: "报价明细", allowAi: false, editable: true, visibleByDefault: true },
      { id: "schedule", title: "工期安排", allowAi: true, editable: true, visibleByDefault: true },
      { id: "payment", title: "付款方式", allowAi: true, editable: true, visibleByDefault: true },
      { id: "warranty", title: "质保和售后", allowAi: true, editable: true, visibleByDefault: true },
      { id: "risks", title: "风险说明", allowAi: true, editable: true, visibleByDefault: true }
    ],
    promptConfig: {
      promptVersion: "renovation-v1",
      systemPrompt: "你是中国装修设计行业的资深商务方案专家，输出专业、克制、可签约的报价方案。",
      userPromptChecklist: [
        "强调环保、工艺、质保和付款节点",
        "不要承诺固定最终施工价",
        "明确主材品牌、型号和现场复尺后可能调整"
      ],
      outputSchemaVersion: "quoteai-sections-v1"
    },
    riskDisclosures: [
      { title: "价格边界", items: ["最终施工价需以现场复尺、主材选型和增减项确认为准。"] },
      { title: "工期边界", items: ["工期受施工条件、物业规定、材料到场和现场变更影响。"] }
    ]
  },
  {
    code: "marketing_agency",
    name: "广告营销/代运营",
    category: "营销代运营",
    targetUser: "广告公司、MCN、代运营团队",
    description: "适用于品牌推广、内容代运营和投流服务报价。",
    sortOrder: 20,
    formSchema: [
      { id: "clientBackground", label: "客户背景", type: "textarea", required: true, placeholder: "品牌现状、行业、目前投放或运营情况" },
      { id: "servicePlatforms", label: "服务平台", type: "multi_select", required: true, options: ["抖音", "小红书", "视频号", "快手", "大众点评"], defaultValue: ["抖音", "小红书"] },
      { id: "serviceType", label: "服务类型", type: "single_select", required: true, options: ["纯内容服务", "内容+投流", "全案代运营"] },
      { id: "deliveryCycle", label: "服务周期(月)", type: "number", required: true, defaultValue: 3 },
      { id: "kpiGoal", label: "目标 KPI", type: "text", placeholder: "如：线索数、到店数、GMV、涨粉" },
      { id: "includeShoot", label: "是否含拍摄", type: "boolean", defaultValue: true },
      { id: "monthlyBudget", label: "月预算区间", type: "money", defaultValue: 3000000 }
    ],
    defaultLineItems: [
      { name: "账号诊断", unit: "项", defaultQuantity: 1, defaultUnitPriceCents: 300000 },
      { name: "内容策划", unit: "月", defaultQuantity: 3, defaultUnitPriceCents: 280000 },
      { name: "图文/视频制作", unit: "组", defaultQuantity: 12, defaultUnitPriceCents: 120000 },
      { name: "投放管理服务费", unit: "月", defaultQuantity: 3, defaultUnitPriceCents: 250000 },
      { name: "月度复盘", unit: "月", defaultQuantity: 3, defaultUnitPriceCents: 80000 }
    ],
    sectionSchema: [
      { id: "overview", title: "项目背景", allowAi: true, editable: true, visibleByDefault: true },
      { id: "insight", title: "市场洞察与平台机会", allowAi: true, editable: true, visibleByDefault: true },
      { id: "strategy", title: "内容与投放策略", allowAi: true, editable: true, visibleByDefault: true },
      { id: "delivery", title: "交付清单", allowAi: true, editable: true, visibleByDefault: true },
      { id: "pricing", title: "报价明细", allowAi: false, editable: true, visibleByDefault: true },
      { id: "timeline", title: "执行排期", allowAi: true, editable: true, visibleByDefault: true },
      { id: "review", title: "数据复盘机制", allowAi: true, editable: true, visibleByDefault: true },
      { id: "compliance", title: "合规与边界说明", allowAi: true, editable: true, visibleByDefault: true }
    ],
    promptConfig: {
      promptVersion: "marketing-v1",
      systemPrompt: "你是中国广告营销和本地生活代运营商务提案专家，擅长输出专业、可签约的方案。",
      userPromptChecklist: [
        "广告费与服务费必须拆开表达",
        "不要承诺固定流量或 GMV",
        "输出要体现复盘与优化机制"
      ],
      outputSchemaVersion: "quoteai-sections-v1"
    },
    riskDisclosures: [
      { title: "效果边界", items: ["不承诺固定 GMV、涨粉或平台流量结果。"] },
      { title: "素材边界", items: ["素材制作、投流预算和达人费用需按实际范围单独确认。"] }
    ]
  },
  {
    code: "software_service",
    name: "IT/软件服务",
    category: "企业服务",
    targetUser: "软件公司、外包团队、SaaS 服务商",
    description: "适用于定制开发、系统二开和私有化交付报价。",
    sortOrder: 30,
    formSchema: [
      { id: "clientBackground", label: "客户背景", type: "textarea", required: true, placeholder: "业务场景、现有系统、痛点和目标" },
      { id: "projectType", label: "项目类型", type: "single_select", required: true, options: ["新系统开发", "二次开发", "私有化部署", "运维服务"] },
      { id: "targetPlatform", label: "目标平台", type: "multi_select", required: true, options: ["Web", "管理后台", "小程序", "App", "API"] },
      { id: "pricingMode", label: "报价方式", type: "single_select", required: true, options: ["固定总价", "按人天计费"] },
      { id: "deliveryCycle", label: "交付周期(周)", type: "number", required: true, defaultValue: 8 },
      { id: "techStack", label: "技术栈", type: "text", placeholder: "如：Next.js / Node.js / Postgres" },
      { id: "sourceCodeDelivery", label: "是否交付源码", type: "boolean", defaultValue: true },
      { id: "maintenancePeriod", label: "维护周期(月)", type: "number", defaultValue: 3 }
    ],
    defaultLineItems: [
      { name: "需求分析", unit: "人天", defaultQuantity: 4, defaultUnitPriceCents: 180000 },
      { name: "UI/UX 设计", unit: "人天", defaultQuantity: 5, defaultUnitPriceCents: 160000 },
      { name: "前端开发", unit: "人天", defaultQuantity: 12, defaultUnitPriceCents: 220000 },
      { name: "后端开发", unit: "人天", defaultQuantity: 12, defaultUnitPriceCents: 240000 },
      { name: "测试部署", unit: "人天", defaultQuantity: 4, defaultUnitPriceCents: 180000 }
    ],
    sectionSchema: [
      { id: "overview", title: "项目背景", allowAi: true, editable: true, visibleByDefault: true },
      { id: "needs", title: "需求理解", allowAi: true, editable: true, visibleByDefault: true },
      { id: "scope", title: "功能范围", allowAi: true, editable: true, visibleByDefault: true },
      { id: "architecture", title: "技术方案", allowAi: true, editable: true, visibleByDefault: true },
      { id: "timeline", title: "项目排期", allowAi: true, editable: true, visibleByDefault: true },
      { id: "pricing", title: "报价明细", allowAi: false, editable: true, visibleByDefault: true },
      { id: "delivery", title: "交付标准", allowAi: true, editable: true, visibleByDefault: true },
      { id: "support", title: "售后维护", allowAi: true, editable: true, visibleByDefault: true },
      { id: "risks", title: "风险与变更机制", allowAi: true, editable: true, visibleByDefault: true }
    ],
    promptConfig: {
      promptVersion: "software-v1",
      systemPrompt: "你是中国 B2B 软件定制与企业服务行业的高级售前架构师，输出专业、清晰、可签约的报价方案。",
      userPromptChecklist: [
        "明确里程碑、交付边界与变更流程",
        "明确第三方服务费用归属",
        "根据是否交付源码调整知识产权条款"
      ],
      outputSchemaVersion: "quoteai-sections-v1"
    },
    riskDisclosures: [
      { title: "需求边界", items: ["需求变更、接口新增和范围扩展不包含在原报价中。"] },
      { title: "第三方边界", items: ["云服务、短信、支付、地图等第三方费用需由客户另行承担或单独报价。"] }
    ]
  }
];

export function getTemplateByCode(code: string) {
  return quoteTemplates.find((template) => template.code === code) ?? null;
}
