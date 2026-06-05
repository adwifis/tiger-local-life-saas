#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

type ProjectFacts = {
  projectName: string;
  oneLinePositioning: string;
  targetUsers: string;
  coreScenario: string;
  mvpScope: string;
  techStack: string[];
  packageManager: string;
  startCommand: string;
  testCommand: string;
  buildCommand: string;
  deployPlatform: string;
  monetization: string;
  chinaChannels: string;
};

const root = resolve(process.argv[2] ?? process.cwd());

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function has(path: string): boolean {
  return existsSync(join(root, path));
}

function detectPackageManager(): string {
  if (has("pnpm-lock.yaml")) return "pnpm";
  if (has("yarn.lock")) return "yarn";
  if (has("bun.lockb") || has("bun.lock")) return "bun";
  if (has("package-lock.json")) return "npm";
  if (has("package.json")) return "npm";
  return "待确认";
}

function commandFor(scriptName: string, fallback: string): string {
  const packageJsonText = readIfExists(join(root, "package.json"));
  if (!packageJsonText) return "待配置";

  try {
    const packageJson = JSON.parse(packageJsonText);
    if (!packageJson.scripts?.[scriptName]) return "待配置";
    const manager = detectPackageManager();
    if (manager === "yarn") return `yarn ${scriptName}`;
    if (manager === "pnpm") return `pnpm ${scriptName}`;
    if (manager === "bun") return `bun run ${scriptName}`;
    return fallback;
  } catch {
    return "待配置";
  }
}

function detectTechStack(): string[] {
  const stack = new Set<string>();
  const packageJsonText = readIfExists(join(root, "package.json"));

  if (packageJsonText) {
    try {
      const packageJson = JSON.parse(packageJsonText);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (deps.next) stack.add("Next.js");
      if (deps.react) stack.add("React");
      if (deps.typescript) stack.add("TypeScript");
      if (deps.tailwindcss) stack.add("Tailwind CSS");
      if (deps["@prisma/client"] || deps.prisma) stack.add("Prisma");
      if (deps.drizzle_orm || deps["drizzle-orm"]) stack.add("Drizzle");
      if (deps.openai) stack.add("OpenAI SDK");
      if (deps["@vercel/analytics"] || has("vercel.json")) stack.add("Vercel");
    } catch {
      stack.add("package.json 解析失败，待确认");
    }
  }

  if (has("pyproject.toml")) stack.add("Python / pyproject.toml");
  if (has("requirements.txt")) stack.add("Python / requirements.txt");
  if (has("Dockerfile")) stack.add("Docker");
  if (has("docker-compose.yml")) stack.add("Docker Compose");
  if (has("vercel.json")) stack.add("Vercel");

  return stack.size ? [...stack] : ["待确认"];
}

function detectProjectName(): string {
  const packageJsonText = readIfExists(join(root, "package.json"));
  if (packageJsonText) {
    try {
      const packageJson = JSON.parse(packageJsonText);
      if (packageJson.name) return packageJson.name;
    } catch {
      // Fall back to README or directory name.
    }
  }

  const readme = readIfExists(join(root, "README.md"));
  const firstHeading = readme.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return firstHeading || basename(root);
}

function buildFacts(): ProjectFacts {
  return {
    projectName: detectProjectName(),
    oneLinePositioning: "待确认",
    targetUsers: "待确认",
    coreScenario: "待确认",
    mvpScope: "待确认",
    techStack: detectTechStack(),
    packageManager: detectPackageManager(),
    startCommand: commandFor("dev", "npm run dev"),
    testCommand: commandFor("test", "npm run test"),
    buildCommand: commandFor("build", "npm run build"),
    deployPlatform: has("vercel.json") ? "Vercel" : "待确认",
    monetization: "待确认",
    chinaChannels: "待确认",
  };
}

function renderAgentsMd(facts: ProjectFacts): string {
  return `# AGENTS.md

> 行业通用 Agent 指令母版。本文件由 \`scripts/generate-agent.ts\` 生成，是本项目唯一 Agent 工作协议入口。

## 1. 项目概览

\`\`\`text
项目名称：${facts.projectName}
一句话定位：${facts.oneLinePositioning}
目标用户：${facts.targetUsers}
核心业务场景：${facts.coreScenario}
MVP 范围：${facts.mvpScope}
技术栈：${facts.techStack.join(" / ")}
包管理器：${facts.packageManager}
部署平台：${facts.deployPlatform}
变现模式：${facts.monetization}
中国市场渠道：${facts.chinaChannels}
\`\`\`

未知信息必须标记为 \`待确认\`，不得编造。

## 2. 最高优先级

- 不得提交密钥、token、个人隐私、客户数据或商业敏感信息。
- 不得回滚、覆盖、删除用户已有改动，除非用户明确要求。
- 不得使用破坏性 git 命令，例如 \`git reset --hard\`，除非用户明确要求。
- 不得在没有验证的情况下宣称任务完成。
- 不得用复杂工程掩盖产品不清晰。
- 任何功能都要服务于商业闭环：获客、激活、留存、转化、收入、交付效率或融资叙事。

## 3. 工作方式

Agent 默认以“AI 创业合伙人 + 全栈研发负责人 + 产品增长负责人”的方式工作。

执行顺序：

1. 阅读 \`README.md\`、\`AGENTS.md\`、\`docs/product.md\`、\`docs/market.md\`、\`docs/architecture.md\` 和相关配置。
2. 用 \`rg\` / \`rg --files\` 快速理解项目结构。
3. 明确任务属于市场分析、需求梳理、原型设计、开发、调试、测试、部署、增长还是运营。
4. 选择最小可验证实现路径。
5. 贴合现有风格做小步修改。
6. 运行相关验证命令。
7. 交付时说明已完成、验证结果、残余风险和下一步。

## 4. 推荐目录

\`\`\`text
project-root/
  AGENTS.md
  README.md
  .env.example
  docs/
    product.md
    market.md
    architecture.md
    growth.md
    operations.md
  apps/
  packages/
  services/
  scripts/
  tests/
  infra/
\`\`\`

## 5. 常用命令

\`\`\`text
启动命令：${facts.startCommand}
测试命令：${facts.testCommand}
构建命令：${facts.buildCommand}
生成 AGENTS.md：node scripts/generate-agent.ts
\`\`\`

若命令显示 \`待配置\`，说明当前仓库尚未提供对应脚本，不能宣称已验证。

## 6. 产品与市场原则

- 先确定垂直场景，再扩大功能范围。
- MVP 只做一个能证明付费意愿的核心闭环。
- 中国市场优先考虑微信生态、企微、飞书、钉钉、小红书、抖音、私域转化、备案和内容合规。
- 定价必须考虑 AI 调用成本、人工交付成本和毛利。
- 增长动作必须可量化，至少跟踪激活率、留存率、转化率、获客成本和回本周期。

## 7. 技术与 AI 标准

- Web 前端优先使用 Next.js / React / TypeScript。
- UI 优先使用 shadcn/ui、Tailwind CSS、lucide-react。
- 数据库默认优先 Postgres，轻量项目可用 SQLite。
- AI 能力必须产品化：结构化输出、成本记录、失败重试、降级策略、人工确认。
- 对企业客户规划数据隔离、权限控制、审计日志和私有化部署。

## 8. 质量门禁

高风险流程必须优先验证：

- 登录和权限。
- 付费和 webhook。
- 数据写入、删除和导出。
- AI 生成、重试和降级。
- 组织数据隔离。

每次开发完成后，优先运行：

\`\`\`text
${facts.testCommand}
${facts.buildCommand}
\`\`\`

## 9. 文档要求

至少维护：

- \`README.md\`：项目说明、启动、测试、部署。
- \`AGENTS.md\`：唯一 Agent 工作协议和项目专属约束。
- \`docs/product.md\`：产品定位、需求、路线图。
- \`docs/market.md\`：市场、竞品、渠道、定价。
- \`docs/architecture.md\`：架构、数据模型、AI 链路、部署。
- \`.env.example\`：环境变量模板。

## 10. 自动更新规则

当技术栈、目录结构、启动命令、部署方式、环境变量、MVP 范围、数据模型、AI 能力、支付、登录、权限、合规或增长渠道变化时，必须同步更新 \`AGENTS.md\`。
`;
}

function main(): void {
  mkdirSync(join(root, "docs"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });

  const facts = buildFacts();
  writeFileSync(join(root, "AGENTS.md"), renderAgentsMd(facts));

  console.log(`Generated AGENTS.md for ${facts.projectName}`);
}

main();

