import { getStarterDashboard } from "@/lib/starter-data";

export const dynamic = "force-dynamic";

const primaryLinks = [
  { href: "/api/health", label: "健康检查" },
  { href: "/api/integrations", label: "环境状态" },
  { href: "/api/usage", label: "运行模式" },
  { href: "/marketing", label: "营销工作台" }
];

export default async function Home() {
  const dashboard = await getStarterDashboard();

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Local Life AI SaaS</span>
          <h1>虎鲸本地生活商家营销助手正在从通用骨架切到商业化首发版，当前重点是门店资料、模板中心、百炼生成与代理后台。</h1>
          <p>
            这个仓库不是从零重写，而是基于 `tiger_ai_saas` 的底座继续推进。当前已经把环境、部署、脚本和产品文档切到
            “本地生活商家营销助手”场景，接下来可以直接往商家端、代理端和平台端功能推进。
          </p>
          <div className="action-row">
            {primaryLinks.map((link) => (
              <a className="button" href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <section className="section metrics" aria-label="基础环境状态">
          {dashboard.summary.map((item) => (
            <article className="card" key={item.label}>
              <span className="muted">{item.label}</span>
              <div className="metric-value">{item.value}</div>
              <span className={`badge ${item.status}`}>{item.note}</span>
            </article>
          ))}
        </section>

        <section className="section grid-two">
          <article className="card">
            <h2>首发范围</h2>
            <ol className="ordered-list">
              {dashboard.focusAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="card">
            <h2>当前集成状态</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>模块</th>
                  <th>状态</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.integrations.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>
                      <span className={`badge ${item.status}`}>{item.label}</span>
                    </td>
                    <td>{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>

        <section className="section grid-two">
          <article className="card">
            <h2>保留底座</h2>
            <div className="checklist">
              {dashboard.kept.map((item) => (
                <span className="tag" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="card">
            <h2>本周输出物</h2>
            <div className="checklist">
              {dashboard.deliverables.map((item) => (
                <span className="tag warn" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
