import Link from "next/link";

import { getQuoteAiDashboard } from "@/lib/quoteai/dashboard";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const dashboard = await getQuoteAiDashboard();

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Quote Records</span>
          <h1>当前报价主链路已经有真实数据库记录，可继续往 AI 生成、编辑、导出和分享追踪扩展。</h1>
          <p>这一页展示的是当前种子数据里的演示报价。下一步补的是新建表单、结构化生成和 PDF 导出，而不是重新造数据模型。</p>
          <div className="action-row">
            <Link className="button" href="/">
              返回工作台
            </Link>
            <a className="button secondary" href="/api/quoteai/dashboard">
              查看仪表盘接口
            </a>
          </div>
        </div>

        <section className="section metrics" aria-label="报价统计">
          {dashboard.stats.map((item) => (
            <article className="card" key={item.label}>
              <span className="muted">{item.label}</span>
              <div className="metric-value">{item.value}</div>
              <span className="badge ok">{item.note}</span>
            </article>
          ))}
        </section>

        <section className="section">
          <article className="card">
            <h2>演示报价列表</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>客户</th>
                  <th>模板</th>
                  <th>总价</th>
                  <th>状态</th>
                  <th>浏览</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.latestQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <Link href={`/quotes/${quote.id}`}>{quote.title}</Link>
                    </td>
                    <td>{quote.clientName}</td>
                    <td>{quote.templateName}</td>
                    <td>{quote.total}</td>
                    <td>{quote.status}</td>
                    <td>{quote.viewCount}</td>
                    <td>{quote.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>
      </section>
    </main>
  );
}
