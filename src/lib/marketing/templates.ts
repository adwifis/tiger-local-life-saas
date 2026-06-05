export type MarketingTemplateInputField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "single_select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type MarketingTemplateDefinition = {
  category: {
    name: string;
    slug: string;
    industry?: string;
    scene?: string;
    platform?: string;
    sortOrder: number;
  };
  name: string;
  slug: string;
  industry: string;
  scene: string;
  platform: string;
  description: string;
  sortOrder: number;
  inputSchema: MarketingTemplateInputField[];
  promptTemplate: {
    system: string;
    outputFormat: string[];
    callToActionRule: string;
  };
  exampleOutput?: {
    title?: string;
    opening?: string;
  };
};

const commonSystemPrompt =
  "你是中国本地生活行业的营销策划顾问。输出要具体、接地气、带转化导向，不要空泛套话，不要解释过程。";

export const marketingTemplates: MarketingTemplateDefinition[] = [
  {
    category: { name: "餐饮增长", slug: "catering-growth", industry: "餐饮", scene: "开业拉新", platform: "朋友圈", sortOrder: 10 },
    name: "餐饮新店开业文案",
    slug: "restaurant-opening-moments",
    industry: "餐饮",
    scene: "新店开业",
    platform: "朋友圈",
    description: "适合新店开业、试营业、商圈首发宣传。",
    sortOrder: 10,
    inputSchema: [
      { id: "offer", label: "开业优惠", type: "text", required: true, placeholder: "如 79 元双人餐" },
      { id: "signature", label: "主推菜品", type: "text", required: true, placeholder: "如 爆汁牛肉汉堡" },
      { id: "validity", label: "活动时间", type: "text", required: true, placeholder: "如 本周五到周日" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["标题", "正文", "行动引导"],
      callToActionRule: "强调限时、到店理由和转发价值。"
    }
  },
  {
    category: { name: "餐饮增长", slug: "catering-growth", industry: "餐饮", scene: "团购促销", platform: "团购详情", sortOrder: 10 },
    name: "餐饮团购套餐推广",
    slug: "restaurant-group-buy",
    industry: "餐饮",
    scene: "团购促销",
    platform: "团购详情",
    description: "适合团购标题、套餐详情和促单朋友圈。",
    sortOrder: 20,
    inputSchema: [
      { id: "offer", label: "套餐内容", type: "textarea", required: true, placeholder: "如 双人招牌套餐包含..." },
      { id: "price", label: "售价", type: "text", required: true, placeholder: "如 128 元" },
      { id: "people", label: "适合人群", type: "text", placeholder: "如 情侣约会、同事聚餐" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["团购标题", "详情描述", "朋友圈短文案"],
      callToActionRule: "突出原价对比、套餐丰富度和适用场景。"
    }
  },
  {
    category: { name: "餐饮增长", slug: "catering-growth", industry: "餐饮", scene: "周末引流", platform: "社群", sortOrder: 10 },
    name: "餐饮周末引流活动",
    slug: "restaurant-weekend-campaign",
    industry: "餐饮",
    scene: "周末引流",
    platform: "社群",
    description: "适合周末客流刺激和商圈活动预热。",
    sortOrder: 30,
    inputSchema: [
      { id: "theme", label: "活动主题", type: "text", required: true, placeholder: "如 亲子周末套餐日" },
      { id: "offer", label: "活动优惠", type: "text", required: true, placeholder: "如 到店送甜品" },
      { id: "time", label: "活动时间", type: "text", required: true, placeholder: "如 周六周日 11:00-20:00" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["活动预热文案", "社群通知", "最后冲刺提醒"],
      callToActionRule: "强调家庭、朋友聚餐和限时到店收益。"
    }
  },
  {
    category: { name: "餐饮增长", slug: "catering-growth", industry: "餐饮", scene: "老客召回", platform: "私聊", sortOrder: 10 },
    name: "餐饮老客召回",
    slug: "restaurant-winback",
    industry: "餐饮",
    scene: "老客召回",
    platform: "私聊",
    description: "适合会员唤醒、沉睡客户召回。",
    sortOrder: 40,
    inputSchema: [
      { id: "offer", label: "召回优惠", type: "text", required: true, placeholder: "如 到店立减 20 元" },
      { id: "deadline", label: "截止时间", type: "text", required: true, placeholder: "如 本周日 22:00 前" },
      { id: "reason", label: "推荐理由", type: "text", placeholder: "如 新上了夏季限定菜" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["短信话术", "微信私聊话术", "朋友圈召回文案"],
      callToActionRule: "降低打扰感，突出熟客专属权益。"
    }
  },
  {
    category: { name: "美业增长", slug: "beauty-growth", industry: "美业", scene: "新客体验", platform: "朋友圈", sortOrder: 20 },
    name: "美业新客体验卡",
    slug: "beauty-trial-card",
    industry: "美业",
    scene: "新客体验",
    platform: "朋友圈",
    description: "适合美容、美发、美甲等门店新客体验卡推广。",
    sortOrder: 50,
    inputSchema: [
      { id: "project", label: "项目名称", type: "text", required: true, placeholder: "如 补水焕肤体验" },
      { id: "price", label: "体验价", type: "text", required: true, placeholder: "如 39.9 元" },
      { id: "sellingPoint", label: "项目卖点", type: "text", required: true, placeholder: "如 30 分钟快速见效" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["标题", "朋友圈正文", "邀约私信话术"],
      callToActionRule: "强调低门槛体验和到店后效果感受。"
    }
  },
  {
    category: { name: "美业增长", slug: "beauty-growth", industry: "美业", scene: "储值促销", platform: "海报", sortOrder: 20 },
    name: "美业储值促销",
    slug: "beauty-topup-campaign",
    industry: "美业",
    scene: "储值促销",
    platform: "海报",
    description: "适合会员储值、满赠和节假日促销。",
    sortOrder: 60,
    inputSchema: [
      { id: "offer", label: "储值方案", type: "textarea", required: true, placeholder: "如 充 1000 送 200" },
      { id: "time", label: "活动时间", type: "text", required: true, placeholder: "如 端午节三天" },
      { id: "projects", label: "适用项目", type: "text", placeholder: "如 洗护、染烫、护理" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["活动海报文案", "朋友圈促单文案", "社群通知"],
      callToActionRule: "强调优惠门槛清晰，避免夸张承诺。"
    }
  },
  {
    category: { name: "美业增长", slug: "beauty-growth", industry: "美业", scene: "节日种草", platform: "小红书", sortOrder: 20 },
    name: "美业节日种草",
    slug: "beauty-holiday-xhs",
    industry: "美业",
    scene: "节日种草",
    platform: "小红书",
    description: "适合节日焕新、小红书种草和案例包装。",
    sortOrder: 70,
    inputSchema: [
      { id: "festival", label: "节日节点", type: "text", required: true, placeholder: "如 七夕、618" },
      { id: "project", label: "主推项目", type: "text", required: true, placeholder: "如 染发焕新套餐" },
      { id: "painPoint", label: "用户痛点", type: "text", placeholder: "如 发色发黄、造型没精神" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["小红书标题", "正文", "hashtags"],
      callToActionRule: "多写场景代入和前后变化感。"
    }
  },
  {
    category: { name: "美业增长", slug: "beauty-growth", industry: "美业", scene: "日常运营", platform: "朋友圈", sortOrder: 20 },
    name: "美业朋友圈日更",
    slug: "beauty-daily-moments",
    industry: "美业",
    scene: "日常运营",
    platform: "朋友圈",
    description: "适合门店日更、案例日签和轻促单。",
    sortOrder: 80,
    inputSchema: [
      { id: "theme", label: "今日主题", type: "text", required: true, placeholder: "如 换季补水提醒" },
      { id: "style", label: "品牌语气", type: "single_select", options: ["专业温和", "轻松亲切", "高端克制"], required: true },
      { id: "focus", label: "用户关注点", type: "text", placeholder: "如 效果稳定、价格透明" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["文案一", "文案二", "文案三"],
      callToActionRule: "控制篇幅，像店长真实在发朋友圈。"
    }
  },
  {
    category: { name: "通用平台内容", slug: "general-content", scene: "探店种草", platform: "小红书", sortOrder: 30 },
    name: "通用小红书探店种草",
    slug: "general-xiaohongshu-seeding",
    industry: "通用本地生活",
    scene: "探店种草",
    platform: "小红书",
    description: "适合本地生活门店的图文笔记种草。",
    sortOrder: 90,
    inputSchema: [
      { id: "highlight", label: "门店亮点", type: "text", required: true, placeholder: "如 性价比高、环境出片" },
      { id: "price", label: "价格带", type: "text", placeholder: "如 人均 68 元" },
      { id: "audience", label: "适合人群", type: "text", placeholder: "如 学生党、情侣、宝妈" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["标题 5 条", "正文 1 篇", "标签建议"],
      callToActionRule: "避免过度广告感，像真实探店分享。"
    }
  },
  {
    category: { name: "通用平台内容", slug: "general-content", scene: "短视频口播", platform: "抖音", sortOrder: 30 },
    name: "通用抖音活动口播",
    slug: "general-douyin-script",
    industry: "通用本地生活",
    scene: "短视频口播",
    platform: "抖音",
    description: "适合活动预热、福利促单和到店转化。",
    sortOrder: 100,
    inputSchema: [
      { id: "theme", label: "活动主题", type: "text", required: true, placeholder: "如 夏季清凉团购节" },
      { id: "offer", label: "活动优惠", type: "text", required: true, placeholder: "如 限时双人套餐 79" },
      { id: "address", label: "门店位置", type: "text", placeholder: "如 南山海岸城附近" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["30 秒口播稿", "15 秒短版", "封面标题"],
      callToActionRule: "开头 3 秒必须有钩子。"
    }
  },
  {
    category: { name: "通用平台内容", slug: "general-content", scene: "社群促单", platform: "社群", sortOrder: 30 },
    name: "通用社群促单文案",
    slug: "general-group-sales",
    industry: "通用本地生活",
    scene: "社群促单",
    platform: "社群",
    description: "适合群发通知、催单和截止提醒。",
    sortOrder: 110,
    inputSchema: [
      { id: "offer", label: "优惠内容", type: "text", required: true, placeholder: "如 到店立减 30 元" },
      { id: "deadline", label: "截止时间", type: "text", required: true, placeholder: "如 今晚 10 点" },
      { id: "goal", label: "转化目标", type: "text", placeholder: "如 引导预约、下单、到店" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["社群通知", "催单文案", "最后 1 小时提醒"],
      callToActionRule: "多写限时感，不要太硬推销。"
    }
  },
  {
    category: { name: "通用平台内容", slug: "general-content", scene: "口碑维护", platform: "点评回复", sortOrder: 30 },
    name: "通用差评回复安抚",
    slug: "general-bad-review-reply",
    industry: "通用本地生活",
    scene: "口碑维护",
    platform: "点评回复",
    description: "适合平台公开回复和私聊安抚。",
    sortOrder: 120,
    inputSchema: [
      { id: "issue", label: "差评摘要", type: "textarea", required: true, placeholder: "如 等位久、服务态度一般" },
      { id: "explanation", label: "商家说明", type: "text", placeholder: "如 当天高峰临时满位" },
      { id: "compensation", label: "补偿方案", type: "text", placeholder: "如 下次到店送甜品" }
    ],
    promptTemplate: {
      system: commonSystemPrompt,
      outputFormat: ["公开回复", "私聊安抚", "二次邀请"],
      callToActionRule: "先道歉，再解释，再给出补救。"
    }
  }
];
