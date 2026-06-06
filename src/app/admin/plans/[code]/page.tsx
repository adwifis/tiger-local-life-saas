import Link from "next/link";
import { notFound } from "next/navigation";

import { PlanEditor } from "@/app/admin/plans/[code]/plan-editor";
import { getMarketingPlanByCode } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

export default async function AdminPlanPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const plan = await getMarketingPlanByCode(code);

  if (!plan) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Plan Admin</span>
          <h1>{plan.name} 现在可以在后台单独维护，方便首发阶段快速试价、调额度、控制可售状态。</h1>
          <p>这页先覆盖商用首发版最关键的套餐运营字段，避免每次调整都回到 seed 或数据库手改。</p>
          <div className="action-row">
            <Link className="button" href="/admin">
              返回平台后台
            </Link>
            <Link className="button secondary" href="/marketing">
              去商家工作台
            </Link>
          </div>
        </div>

        <PlanEditor plan={plan} />
      </section>
    </main>
  );
}
