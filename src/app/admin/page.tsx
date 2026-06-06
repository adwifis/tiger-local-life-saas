import Link from "next/link";

import { getAdminWorkspace } from "@/lib/marketing/backoffice";
import { SubscriptionOpener } from "@/app/admin/subscription-opener";

export const dynamic = "force-dynamic";

function toYuan(priceCents: number) {
  return `¥${(priceCents / 100).toFixed(0)}`;
}

export default async function AdminPage() {
  const workspace = await getAdminWorkspace();
  const activePlans = workspace.plans.filter((plan) => plan.isActive);

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Admin Console</span>
          <h1>平台后台先把套餐、订阅、代理和生成记录挂到一处，保证首发版能运营、能开通、能查问题。</h1>
          <p>当前是商用首发版骨架，重点放在手工开通套餐和运营巡检，而不是过早做复杂自动化。</p>
          <div className="action-row">
            <Link className="button" href="/marketing">
              商家工作台
            </Link>
            <Link className="button secondary" href="/agent">
              代理后台
            </Link>
          </div>
        </div>

        <section className="section metrics">
          <article className="card">
            <span className="muted">商家门店</span>
            <div className="metric-value">{workspace.stores.length}</div>
            <span className="badge ok">最近活跃样本</span>
          </article>
          <article className="card">
            <span className="muted">代理</span>
            <div className="metric-value">{workspace.agents.length}</div>
            <span className="badge ok">可扩客户池</span>
          </article>
          <article className="card">
            <span className="muted">套餐</span>
            <div className="metric-value">{workspace.plans.length}</div>
            <span className="badge ok">手工开通</span>
          </article>
          <article className="card">
            <span className="muted">最近生成</span>
            <div className="metric-value">{workspace.generations.length}</div>
            <span className="badge ok">运营巡检</span>
          </article>
        </section>

        <section className="section grid-two">
          <article className="card">
            <h2>门店与额度</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>门店</th>
                  <th>城市</th>
                  <th>行业</th>
                  <th>状态</th>
                  <th>剩余额度</th>
                </tr>
              </thead>
              <tbody>
                {workspace.stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.city}</td>
                    <td>{store.industry}</td>
                    <td>{store.status}</td>
                    <td>{store.remainingQuota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card">
            <h2>套餐与订阅</h2>
            <div className="history-list">
              {workspace.plans.map((plan) => (
                <article className="history-card" key={plan.id}>
                  <strong>
                    <Link href={`/admin/plans/${plan.code}`}>{plan.name}</Link>
                  </strong>
                  <span>
                    {plan.code} · {plan.roleScope} · {plan.monthlyQuota} 次 / 月
                  </span>
                  <span className="muted">
                    {toYuan(plan.priceCents)} · {plan.isActive ? "启用中" : "已停用"}
                  </span>
                </article>
              ))}
            </div>

            <h2>最近开通</h2>
            <div className="history-list">
              {workspace.subscriptions.map((subscription) => (
                <article className="history-card" key={subscription.id}>
                  <strong>{subscription.targetName}</strong>
                  <span>
                    {subscription.planName} · {subscription.status}
                  </span>
                  <span className="muted">到期 {subscription.endAt}</span>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="section">
          <SubscriptionOpener plans={activePlans} stores={workspace.stores} />
        </section>

        <section className="section grid-two">
          <article className="card">
            <h2>模板清单</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>模板</th>
                  <th>分类</th>
                  <th>平台</th>
                  <th>字段数</th>
                  <th>使用次数</th>
                </tr>
              </thead>
              <tbody>
                {workspace.templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <Link href={`/admin/templates/${template.slug}`}>{template.name}</Link>
                      <div className="table-subtext">
                        {template.industry} · {template.scene}
                      </div>
                    </td>
                    <td>{template.categoryName}</td>
                    <td>{template.platform}</td>
                    <td>{template.fieldCount}</td>
                    <td>{template.generationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card">
            <h2>最近生成明细</h2>
            <div className="history-list">
              {workspace.generations.map((generation) => (
                <article className="history-card" key={generation.id}>
                  <strong>{generation.templateName}</strong>
                  <span>{generation.storeName}</span>
                  <span className="muted">
                    {generation.status} · {generation.model}
                  </span>
                  <span className="muted">{generation.createdAt}</span>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="section">
          <article className="card">
            <h2>最近操作日志</h2>
            <div className="history-list">
              {workspace.operationLogs.map((log) => (
                <article className="history-card" key={log.id}>
                  <strong>
                    {log.actorName} · {log.action}
                  </strong>
                  <span>
                    {log.targetType} · {log.targetLabel}
                  </span>
                  <span className="muted">{log.detail}</span>
                  <span className="muted">{log.createdAt}</span>
                </article>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
