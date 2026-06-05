import "dotenv/config";

const checks = [
  {
    name: "APP_ENV",
    requiredFor: "optional",
    description: "运行环境，生产建议为 production。"
  },
  {
    name: "APP_URL",
    requiredFor: "production",
    description: "公网访问地址，用于回调、消息链接和客户访问。"
  },
  {
    name: "DATABASE_URL",
    requiredFor: "production",
    description: "Postgres 连接串，下一个项目接入数据库时必须配置。"
  },
  {
    name: "POSTGRES_PASSWORD",
    requiredFor: "docker",
    description: "Docker 本地/服务器 Postgres 密码，必须随机生成，不能使用默认值。"
  },
  {
    name: "AUTH_SECRET",
    requiredFor: "production",
    description: "登录和会话签名密钥，生产环境必须随机生成。"
  },
  {
    name: "ADMIN_API_KEY",
    requiredFor: "production",
    description: "生产写接口管理密钥，用于保护下一个项目的写操作。"
  },
  {
    name: "BAILIAN_API_KEY",
    requiredFor: "integration",
    description: "阿里云百炼 API Key，用于真实 AI 调用。"
  },
  {
    name: "BAILIAN_BASE_URL",
    requiredFor: "integration",
    description: "百炼 OpenAI 兼容 API 地址。"
  },
  {
    name: "BAILIAN_DAILY_MODEL",
    requiredFor: "integration",
    description: "日常开发/生成模型。"
  },
  {
    name: "BAILIAN_COMPLEX_MODEL",
    requiredFor: "integration",
    description: "复杂开发或高质量生成模型。"
  },
  {
    name: "WECOM_WEBHOOK_URL",
    requiredFor: "integration",
    description: "企业微信或其他通知 Webhook，真实发送前必须有审计和授权。"
  },
  {
    name: "S3_BUCKET",
    requiredFor: "integration",
    description: "OSS/COS bucket，下一个项目的素材与文件存储使用。"
  }
];

const mode = process.env.APP_ENV === "production" ? "production" : "dev";
const unsafeValues = new Set([
  "password",
  "admin",
  "123456",
  "changeme",
  "change_me",
  "tiger_dev_password",
  "your-secret-key",
  "your-api-key"
]);

const missing = checks.filter((check) => {
  if (check.requiredFor === "optional") return false;
  if (check.requiredFor === "docker") return false;
  if (mode === "dev" && check.requiredFor !== "dev") return false;
  if (mode === "production" && check.requiredFor === "integration") return false;
  return !process.env[check.name];
});

const integrationMissing = checks.filter(
  (check) => check.requiredFor === "integration" && !process.env[check.name]
);

console.log(`Environment mode: ${mode}`);

const unsafeConfigured = checks.filter((check) => {
  const value = process.env[check.name];
  if (!value) return false;
  return unsafeValues.has(value.trim().toLowerCase());
});

if (missing.length) {
  console.error("Missing required environment variables:");
  for (const item of missing) {
    console.error(`- ${item.name}: ${item.description}`);
  }
  process.exit(1);
}

if (integrationMissing.length) {
  console.warn("Integration variables not configured yet:");
  for (const item of integrationMissing) {
    console.warn(`- ${item.name}: ${item.description}`);
  }
}

if (unsafeConfigured.length) {
  console.error("Unsafe placeholder-like environment values detected:");
  for (const item of unsafeConfigured) {
    console.error(`- ${item.name}: replace with a random production value.`);
  }
  process.exit(1);
}

console.log("Environment check passed.");
