import { prisma } from "@/lib/db";

export async function getQuoteAiDashboard() {
  const [companyCount, templateCount, quoteCount, latestQuotes] = await Promise.all([
    prisma.company.count(),
    prisma.industryTemplate.count(),
    prisma.quote.count(),
    prisma.quote.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      take: 6,
      include: {
        company: {
          select: {
            name: true,
            slug: true
          }
        },
        template: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
  ]);

  const totals = latestQuotes.reduce(
    (accumulator, quote) => {
      accumulator.totalCents += quote.totalCents;
      accumulator.viewCount += quote.viewCount;
      return accumulator;
    },
    {
      totalCents: 0,
      viewCount: 0
    }
  );

  return {
    stats: [
      {
        label: "演示公司",
        value: String(companyCount),
        note: "已落库"
      },
      {
        label: "行业模板",
        value: String(templateCount),
        note: "首发 3 个"
      },
      {
        label: "报价单",
        value: String(quoteCount),
        note: "真实数据库记录"
      },
      {
        label: "最近浏览",
        value: String(totals.viewCount),
        note: "演示分享累计"
      }
    ],
    latestQuotes: latestQuotes.map((quote) => ({
      id: quote.id,
      title: quote.title,
      companyName: quote.company.name,
      companySlug: quote.company.slug,
      templateName: quote.templateNameSnapshot || quote.template.name,
      status: quote.status,
      total: (quote.totalCents / 100).toLocaleString("zh-CN", {
        style: "currency",
        currency: quote.currency
      }),
      clientName: quote.clientName,
      updatedAt: quote.updatedAt.toISOString().slice(0, 10),
      shareEnabled: quote.shareEnabled,
      viewCount: quote.viewCount
    }))
  };
}
