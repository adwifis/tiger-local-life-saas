import Link from "next/link";
import { notFound } from "next/navigation";

import { getMarketingStoreBySlug } from "@/lib/marketing/service";
import { StoreEditor } from "@/app/marketing/stores/[slug]/store-editor";

export const dynamic = "force-dynamic";

export default async function MarketingStorePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const store = await getMarketingStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="content starter-content">
        <div className="hero starter-hero">
          <span className="eyebrow">Store Profile</span>
          <h1>{store.name} 的商家资料维护页已经独立出来了，后续可以继续扩多门店切换和品牌模板。</h1>
          <p>这页直接决定生成质量。门店画像、项目和卖点比多接几个模型更关键。</p>
          <div className="action-row">
            <Link className="button" href="/marketing">
              返回营销工作台
            </Link>
            <Link className="button secondary" href="/admin">
              去平台后台
            </Link>
          </div>
        </div>

        <StoreEditor store={store} />
      </section>
    </main>
  );
}
