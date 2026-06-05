# AGENT.md

本文件是当前仓库给 Codex / Claude / Qwen / 其他开发 Agent 的项目级执行入口。

## 当前项目

- 项目名：虎鲸本地生活商家营销助手
- 目标：7 天内做出可商业化上线的中国市场 AI SaaS 首发版
- 参考仓库：`/Users/z/Desktop/tigerclub/tiger_ai_saas`
- 当前仓库：`/Users/z/Desktop/tigerclub/nine_ai`

## 核心执行原则

- 一切以“可商业化上线”为目标，不做演示型空页面。
- 默认优先复用现有底座，不全量重写基础设施。
- 先完成商家、代理、平台三方核心闭环，再做花哨能力。
- 支付、权限、额度、日志、部署是首发版的高优先级。

## 当前产品边界

首发必须覆盖：

- 门店资料
- 模板中心
- 营销内容生成
- 生成历史
- 套餐额度
- 代理开客户和代运营
- 平台后台

首发暂不覆盖：

- 微信/支付宝自动支付
- 自动分佣结算
- 企业微信自动发布
- 多模型切换面板

## Codex / Bailian 模式选择

### `cx`

适用：

- PRD
- 架构评审
- 权限、支付、套餐、数据隔离
- 上线风险复核

命令：

```bash
npm run ai:plan -- "review 套餐和代理权限"
```

### `cxb`

适用：

- 日常编码
- 页面实现
- API 开发
- 文档整理
- 数据表增量调整

命令：

```bash
npm run ai:daily -- "实现商家模板中心"
```

### `cxbm`

适用：

- 跨文件重构
- 复杂 Prisma schema 调整
- 棘手 bug
- 大块生成代码

命令：

```bash
npm run ai:max -- "重构代理与门店数据模型"
```

### 自动推荐

```bash
npm run ai:auto -- "补代理套餐开通流程"
```

自动规则：

- 包含 `架构`、`review`、`风险`、`支付`、`权限`、`上线` 时优先 `cx`
- 包含 `重构`、`schema`、`migration`、`复杂`、`跨文件` 时优先 `cxbm`
- 其余默认 `cxb`

## 敏感事项

以下内容不要自动修改或提交：

- `.env`
- 私钥 / `.pem`
- 真实 API Key
- 服务器 root 级配置
- GitHub 远程仓库地址

除非用户明确确认。

## 执行顺序

1. 先读 `docs/prd.md`
2. 再读 `docs/development-plan.md`
3. 再读 `docs/architecture.md`
4. 再开始动代码
