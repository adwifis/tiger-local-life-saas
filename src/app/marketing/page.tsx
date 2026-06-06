import Link from "next/link";

import { getMarketingDashboard } from "@/lib/marketing/dashboard";
import { listMarketingStores, listMarketingTemplates } from "@/lib/marketing/service";
import { MarketingConsole } from "@/app/marketing/marketing-console";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [dashboard, stores, templates] = await Promise.all([
    getMarketingDashboard(),
    listMarketingStores(),
    listMarketingTemplates()
  ]);

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
            <Link className="button secondary" href="/agent">
              代理后台
            </Link>
            <Link className="button secondary" href="/admin">
              平台后台
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

        <MarketingConsole
          recentGenerations={dashboard.generations}
          stores={stores}
          templates={templates.map((template) => ({
            id: template.id,
            slug: template.slug,
            name: template.name,
            scene: template.scene,
            platform: template.platform,
            description: template.description,
            inputSchema: template.inputSchema as Array<{
              id: string;
              label: string;
              type: "text" | "textarea" | "number" | "single_select";
              required?: boolean;
              placeholder?: string;
              options?: string[];
            }>
          }))}
        />

        <section className="section">
          <article className="card">
            <div className="panel-head">
              <div>
                <h2>门店资料入口</h2>
                <p className="muted">商家首发版先维护单门店资料，后续再扩多门店切换。</p>
              </div>
            </div>
            <table className="table compact">
              <thead>
                <tr>
                  <th>门店</th>
                  <th>行业</th>
                  <th>城市</th>
                  <th>剩余额度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.industry}</td>
                    <td>{store.city}</td>
                    <td>{store.remainingQuota}</td>
                    <td>
                      <Link className="button secondary" href={`/marketing/stores/${store.slug}`}>
                        编辑资料
                      </Link>
                    </td>
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
