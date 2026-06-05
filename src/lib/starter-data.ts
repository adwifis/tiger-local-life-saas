import { getStorageStatus } from "@/lib/storage/oss";
import { prisma } from "@/lib/db";

type StarterStatus = "ok" | "warning";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function hasRedisUrl() {
  return Boolean(process.env.REDIS_URL);
}

function hasBailianKey() {
  return Boolean(process.env.BAILIAN_API_KEY);
}

export async function getStarterDashboard() {
  const storage = getStorageStatus();
  const databaseReady = hasDatabaseUrl();
  const redisReady = hasRedisUrl();
  const bailianReady = hasBailianKey();
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
  const [quoteCount, shareCount] = databaseReady
    ? await Promise.all([prisma.quote.count(), prisma.quoteShare.count()])
    : [0, 0];

  const integrations = [
    {
      name: "阿里云百炼",
      label: bailianReady ? "已配置" : "待填入",
      status: bailianReady ? ("ok" as StarterStatus) : ("warning" as StarterStatus),
      note: bailianReady ? "本地可直接切到真实调用。" : "当前仍可用 dry-run 开发。"
    },
    {
      name: "对象存储",
      label: storage.configured ? "已配置" : "待填入",
      status: storage.configured ? ("ok" as StarterStatus) : ("warning" as StarterStatus),
      note: storage.configured ? "OSS/COS 兼容配置已存在。" : "素材上传仍保留为后续能力。"
    },
    {
      name: "Postgres",
      label: databaseReady ? "已配置" : "待填入",
      status: databaseReady ? ("ok" as StarterStatus) : ("warning" as StarterStatus),
      note: databaseReady ? "可直接执行 Prisma push / seed。" : "先运行本地 Docker 数据库。"
    },
    {
      name: "Redis",
      label: redisReady ? "已配置" : "待填入",
      status: redisReady ? ("ok" as StarterStatus) : ("warning" as StarterStatus),
      note: redisReady ? "本地 Redis 可复用。" : "首发版即使缺失也不阻塞核心开发。"
    },
    {
      name: "GitHub",
      label: "待确认远程",
      status: "warning" as StarterStatus,
      note: "当前仓库尚未配置新的 origin。"
    },
    {
      name: "Docker / 部署脚本",
      label: "已保留",
      status: "ok" as StarterStatus,
      note: "可直接用于本地和阿里云 ECS 部署。"
    }
  ];

  return {
    summary: [
      {
        label: "当前模式",
        value: "Local Life SaaS",
        note: appEnv,
        status: "ok"
      },
      {
        label: "本周目标",
        value: "7 天",
        note: "商业化首发版",
        status: "ok"
      },
      {
        label: "演示数据",
        value: String(quoteCount),
        note: quoteCount > 0 ? "参考数据已可复用" : "待初始化",
        status: quoteCount > 0 ? "ok" : "warning"
      },
      {
        label: "分享记录",
        value: String(shareCount),
        note: shareCount > 0 ? "追踪链路有参考数据" : "待初始化",
        status: shareCount > 0 ? "ok" : "warning"
      },
      {
        label: "百炼",
        value: bailianReady ? "Ready" : "Template",
        note: bailianReady ? "已检测到 API Key" : "脚本和变量已就位",
        status: bailianReady ? "ok" : "warning"
      },
      {
        label: "部署",
        value: "Docker",
        note: "阿里云 ECS 就绪",
        status: "ok"
      }
    ],
    kept: [
      "Next.js + TypeScript Web 骨架",
      "Prisma + Postgres",
      "Redis 本地开发基础",
      "Docker Compose + Dockerfile",
      "百炼环境变量和校验脚本",
      "安全检查和部署脚本"
    ],
    deliverables: [
      "商家门店资料页",
      "模板中心与 12 套模板",
      "4 个百炼生成器",
      "代理客户管理",
      "平台套餐后台",
      "阿里云可部署版本"
    ],
    integrations,
    focusAreas: [
      "商家端：门店资料、模板中心、AI 生成、历史记录",
      "代理端：客户门店管理、代运营、额度查看",
      "平台端：模板、套餐、代理、生成记录管理",
      "基础设施：百炼、Docker、阿里云部署、GitHub 远程接入"
    ]
  };
}
