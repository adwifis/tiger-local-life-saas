import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateEditor } from "@/app/admin/templates/[slug]/template-editor";
import { getMarketingTemplateBySlug } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

export default async function AdminTemplatePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const template = await getMarketingTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Template Admin</span>
          <h1>{template.name} 现在可以在后台单独维护，不需要再改 seed 或代码文件才能调模板。</h1>
          <p>这页优先支持运营常用的状态、排序和提示词调整，先把首发版的人工调优流程跑通。</p>
          <div className="action-row">
            <Link className="button" href="/admin">
              返回平台后台
            </Link>
            <Link className="button secondary" href="/marketing">
              去商家工作台
            </Link>
          </div>
        </div>

        <TemplateEditor template={template} />
      </section>
    </main>
  );
}
