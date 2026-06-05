import Link from "next/link";

import { getMarketingDashboard } from "@/lib/marketing/dashboard";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const dashboard = await getMarketingDashboard();

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Merchant Marketing Console</span>
          <h1>营销 SaaS 的第一条真实业务链路已经搭起来了：门店、模板、生成记录和额度数据都能在当前仓库里跑通。</h1>
          <p>
            这一页用来做首版工作台联调。下一步会继续补商家资料编辑、代理客户切换和更正式的套餐后台。
          </p>
          <div className="action-row">
            <Link className="button" href="/">
              返回首页
            </Link>
            <a className="button secondary" href="/api/marketing/templates">
              查看模板接口
            </a>
            <a className="button secondary" href="/api/marketing/stores">
              查看门店接口
            </a>
          </div>
        </div>

        <section className="section metrics" aria-label="营销工作台统计">
          {dashboard.stats.map((item) => (
            <article className="card" key={item.label}>
              <span className="muted">{item.label}</span>
              <div className="metric-value">{item.value}</div>
              <span className="badge ok">{item.note}</span>
            </article>
          ))}
        </section>

        <section className="section grid-two">
          <article className="card">
            <h2>演示门店</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>门店</th>
                  <th>行业</th>
                  <th>城市</th>
                  <th>商圈</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.industry}</td>
                    <td>{store.city}</td>
                    <td>{store.businessArea || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card">
            <h2>最近生成</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>门店</th>
                  <th>模板</th>
                  <th>状态</th>
                  <th>模型</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.generations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.storeName}</td>
                    <td>{item.templateName}</td>
                    <td>{item.status}</td>
                    <td>{item.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>

        <section className="section">
          <article className="card">
            <h2>首发模板</h2>
            <div className="template-grid">
              {dashboard.templates.map((template) => (
                <article className="template-card" key={template.id}>
                  <span className="badge ok">{template.platform}</span>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <span className="muted">{template.scene}</span>
                </article>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
