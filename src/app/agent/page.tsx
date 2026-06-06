import Link from "next/link";

import { getAgentWorkspace } from "@/lib/marketing/backoffice";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const agents = await getAgentWorkspace();

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Agent Workspace</span>
          <h1>代理侧先做真实交付视图：客户门店、服务状态、剩余额度一页看完。</h1>
          <p>首发版先支持代理开客户和代运营，不在这一周内做自动分佣结算。</p>
          <div className="action-row">
            <Link className="button" href="/marketing">
              商家工作台
            </Link>
            <Link className="button secondary" href="/admin">
              平台后台
            </Link>
          </div>
        </div>

        <section className="section">
          {agents.map((agent) => (
            <article className="card" key={agent.id}>
              <div className="panel-head">
                <div>
                  <h2>{agent.companyName}</h2>
                  <p className="muted">
                    {agent.contactName} · {agent.status} · 客户 {agent.merchantCount} 家
                  </p>
                </div>
                <span className="badge ok">代理后台基础版</span>
              </div>

              <table className="table compact">
                <thead>
                  <tr>
                    <th>客户门店</th>
                    <th>城市</th>
                    <th>行业</th>
                    <th>服务状态</th>
                    <th>剩余额度</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.merchants.map((merchant) => (
                    <tr key={merchant.id}>
                      <td>{merchant.storeName}</td>
                      <td>{merchant.city}</td>
                      <td>{merchant.industry}</td>
                      <td>{merchant.serviceStatus}</td>
                      <td>{merchant.remainingQuota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
