import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type QuoteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      company: true,
      template: true,
      lineItems: {
        orderBy: {
          sortOrder: "asc"
        }
      },
      shares: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!quote) {
    notFound();
  }

  const generatedSections = (quote.editableSections ?? quote.generatedSections ?? {}) as Record<string, string>;
  const sectionEntries = Object.entries(generatedSections);

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Quote Detail</span>
          <h1>{quote.title}</h1>
          <p>
            {quote.company.name} · {quote.templateNameSnapshot} · {quote.clientName}
          </p>
          <div className="action-row">
            <Link className="button" href="/quotes">
              返回报价列表
            </Link>
            <span className="button secondary">状态：{quote.status}</span>
          </div>
        </div>

        <section className="section grid-two">
          <article className="card">
            <h2>基本信息</h2>
            <div className="detail-list">
              <div>
                <strong>客户</strong>
                <span>{quote.clientName}</span>
              </div>
              <div>
                <strong>联系人</strong>
                <span>{quote.contactName || "待补充"}</span>
              </div>
              <div>
                <strong>模板</strong>
                <span>{quote.templateNameSnapshot}</span>
              </div>
              <div>
                <strong>总价</strong>
                <span>
                  {(quote.totalCents / 100).toLocaleString("zh-CN", {
                    style: "currency",
                    currency: quote.currency
                  })}
                </span>
              </div>
              <div>
                <strong>分享</strong>
                <span>{quote.shareEnabled ? "已开启" : "未开启"}</span>
              </div>
              <div>
                <strong>浏览</strong>
                <span>{quote.viewCount} 次</span>
              </div>
            </div>
          </article>

          <article className="card">
            <h2>分享状态</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>状态</th>
                  <th>浏览</th>
                  <th>到期</th>
                </tr>
              </thead>
              <tbody>
                {quote.shares.length > 0 ? (
                  quote.shares.map((share) => (
                    <tr key={share.id}>
                      <td>{share.token.slice(0, 10)}...</td>
                      <td>{share.isActive ? "有效" : "停用"}</td>
                      <td>{share.viewCount}</td>
                      <td>{share.expiresAt ? share.expiresAt.toISOString().slice(0, 10) : "长期"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>暂无分享记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>
        </section>

        <section className="section grid-two">
          <article className="card">
            <h2>报价项</h2>
            <table className="table compact">
              <thead>
                <tr>
                  <th>项目</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      {Number(item.quantity)} {item.unit || ""}
                    </td>
                    <td>¥{(item.unitPriceCents / 100).toLocaleString("zh-CN")}</td>
                    <td>¥{(item.subtotalCents / 100).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card">
            <h2>方案章节</h2>
            <div className="section-stack">
              {sectionEntries.length > 0 ? (
                sectionEntries.map(([key, value]) => (
                  <article className="section-block" key={key}>
                    <h3>{key}</h3>
                    <p>{value}</p>
                  </article>
                ))
              ) : (
                <p className="muted">当前还没有 AI 生成内容，下一步会把百炼结构化输出接到这里。</p>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
