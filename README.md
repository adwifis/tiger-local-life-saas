# 虎鲸本地生活商家营销助手

基于 `tiger_ai_saas` 参考项目二次开发的商业化 AI SaaS 底座，目标是在 1 周内完成可上线、可演示、可收费的首发版本。

当前阶段重点不是“大而全功能”，而是优先完成这 4 条商用主链路：

- 商家录入门店资料
- 选择模板并生成营销内容
- 代理为客户开通并代运营使用
- 平台后台手工开通套餐并管理额度

## 当前定位

- 产品：本地生活商家营销助手
- 用户：门店老板、店长、代运营团队、区域代理
- AI：阿里云百炼
- 部署：Docker + 阿里云服务器
- 开发方式：Codex Plus + Bailian 双模式协作

## 仓库状态

当前仓库已经完成这些基础能力迁移：

- Next.js + TypeScript Web 项目骨架
- Prisma + Postgres 基础
- Redis 本地开发基础
- Dockerfile + docker-compose 本地和服务器部署模板
- 百炼环境变量和 Codex/Bailian 快捷脚本
- 环境检查、运行校验、安全检查脚本
- 初始运营文档、PRD、开发排期

当前仓库还没有完成这些业务能力：

- 正式登录和商家工作台
- 门店资料与模板库落库
- 阿里百炼真实生成链路
- 代理后台
- 商用套餐后台

## 快速开始

### 1. 初始化本地环境

```bash
npm ci
npm run setup:local
docker compose up -d postgres redis
npm run db:generate
npm run db:push
npm run db:seed
```

### 2. 启动开发环境

```bash
npm run dev
```

打开：

```text
http://127.0.0.1:3000
```

### 3. 校验环境

```bash
npm run check:env
npm run verify:runtime
npm run ai:verify
```

## Codex / Bailian 快捷命令

本仓库支持按任务自动推荐模型模式。

```bash
npm run ai:auto -- "补商家模板中心"
npm run ai:auto -- "review 代理权限和套餐风险"
npm run ai:daily -- "实现模板 CRUD"
npm run ai:max -- "重构 Prisma schema 和代理数据结构"
```

模式说明：

- `cx`：产品规划、架构 review、支付/权限/上线风险复核
- `cxb`：日常开发、页面实现、接口联调、文档整理
- `cxbm`：跨文件重构、棘手 bug、复杂数据结构改造

## 常用脚本

```bash
npm run setup:local      # 生成本地 .env 并尝试导入 ~/.config/bailian.env
npm run check:env        # 校验环境变量
npm run security:audit   # 检查危险文件和绑定端口
npm run db:generate      # 生成 Prisma Client
npm run db:push          # 推送 schema 到数据库
npm run db:seed          # 写入种子数据
npm run verify:runtime   # 运行时检查
npm run ai:auto -- "..." # 自动推荐并执行 Codex/Bailian 模式
npm run ai:verify        # 验证 bailian / bailian-max profile
npm run ops:show         # 输出 GitHub、阿里云、百炼入口说明
```

## 目录说明

```text
docs/
  architecture.md
  deployment.md
  development-plan.md
  ops-setup.md
  product.md
  prd.md

scripts/
  bootstrap-local.sh
  codex-mode.sh
  deploy-lite.sh
  verify-codex-bailian.sh

src/
  app/
  lib/
```

## 商业化开发原则

- 先做可卖闭环，再做高级自动化
- 先人工开通套餐，再接正式支付
- 先做高频模板，再扩行业
- 先做代理开客户，再做自动分佣
- 先保证结果可用，再追求“AI 感”

## 阿里云 / GitHub / 百炼入口

详细见：

- [部署说明](./docs/deployment.md)
- [运维接入说明](./docs/ops-setup.md)
- [产品文档](./docs/prd.md)

## 注意

- 不要提交 `.env`、密钥、私钥、客户数据。
- 当前版本是“商业化开发底座”，不是已完成的正式业务系统。
- 推送 GitHub 远程仓库前，先确认目标仓库地址和分支策略。
