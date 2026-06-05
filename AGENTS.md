# AGENTS.md

本仓库保留此文件作为历史兼容入口，当前唯一有效的项目级执行协议已经切到 [AGENT.md](./AGENT.md)。

如果你是 Codex 或其他开发 Agent，请先读：

1. [AGENT.md](./AGENT.md)
2. [docs/prd.md](./docs/prd.md)
3. [docs/development-plan.md](./docs/development-plan.md)
4. [docs/architecture.md](./docs/architecture.md)

## 当前项目状态

- 项目：虎鲸本地生活商家营销助手
- 开发方式：基于 `tiger_ai_saas` 参考项目二次开发
- 目标：1 周内完成可商业化上线的首发版

## 当前唯一默认模型切换规则

- `cx`：规划、架构、权限、支付、上线 review
- `cxb`：日常实现、页面和接口开发
- `cxbm`：跨文件重构、复杂数据结构和棘手 bug

命令入口：

```bash
npm run ai:auto -- "你的任务"
npm run ai:daily -- "你的任务"
npm run ai:max -- "你的任务"
npm run ai:plan -- "你的任务"
```
