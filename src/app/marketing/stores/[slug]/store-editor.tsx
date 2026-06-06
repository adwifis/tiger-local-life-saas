"use client";

import { useState } from "react";

type StoreEditorProps = {
  store: {
    slug: string;
    name: string;
    industry: string;
    city: string;
    district: string | null;
    businessArea: string | null;
    avgTicketCents: number | null;
    targetAudience: string | null;
    brandTone: string | null;
    contactPhone: string | null;
    mainProducts: string[];
    sellingPoints: string[];
    remainingQuota: number;
    monthlyLimit: number;
    subscriptions: Array<{
      id: string;
      status: string;
      startAt: string;
      endAt: string;
      planName: string;
    }>;
  };
};

export function StoreEditor({ store }: StoreEditorProps) {
  const [form, setForm] = useState({
    name: store.name,
    industry: store.industry,
    city: store.city,
    district: store.district || "",
    businessArea: store.businessArea || "",
    avgTicketCents: store.avgTicketCents ? String(store.avgTicketCents) : "",
    targetAudience: store.targetAudience || "",
    brandTone: store.brandTone || "",
    contactPhone: store.contactPhone || "",
    mainProducts: store.mainProducts.join("\n"),
    sellingPoints: store.sellingPoints.join("\n")
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/marketing/stores/${store.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry,
          city: form.city,
          district: form.district,
          businessArea: form.businessArea,
          avgTicketCents: form.avgTicketCents ? Number(form.avgTicketCents) : null,
          targetAudience: form.targetAudience,
          brandTone: form.brandTone,
          contactPhone: form.contactPhone,
          mainProducts: form.mainProducts.split("\n").map((item) => item.trim()).filter(Boolean),
          sellingPoints: form.sellingPoints.split("\n").map((item) => item.trim()).filter(Boolean),
          actorUserEmail: "admin@quoteai.local"
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "STORE_UPDATE_FAILED");
      }

      setMessage("门店资料已保存。");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="section grid-two">
      <article className="card">
        <div className="panel-head">
          <div>
            <h2>门店资料编辑</h2>
            <p className="muted">这部分是生成质量的基础输入。首发版先把门店画像、主推项目和卖点维护到位。</p>
          </div>
          <div className="quota-chip">
            <strong>{store.remainingQuota}</strong>
            <span>剩余额度 / {store.monthlyLimit}</span>
          </div>
        </div>

        <form className="marketing-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span>门店名称</span>
              <input required value={form.name} onChange={(event) => setField("name", event.target.value)} />
            </label>
            <label className="field">
              <span>行业</span>
              <input required value={form.industry} onChange={(event) => setField("industry", event.target.value)} />
            </label>
            <label className="field">
              <span>城市</span>
              <input required value={form.city} onChange={(event) => setField("city", event.target.value)} />
            </label>
            <label className="field">
              <span>区域 / 商圈</span>
              <input value={form.businessArea} onChange={(event) => setField("businessArea", event.target.value)} />
            </label>
            <label className="field">
              <span>客单价分</span>
              <input type="number" value={form.avgTicketCents} onChange={(event) => setField("avgTicketCents", event.target.value)} />
            </label>
            <label className="field">
              <span>联系电话</span>
              <input value={form.contactPhone} onChange={(event) => setField("contactPhone", event.target.value)} />
            </label>
          </div>

          <label className="field">
            <span>目标客群</span>
            <input value={form.targetAudience} onChange={(event) => setField("targetAudience", event.target.value)} />
          </label>

          <label className="field">
            <span>品牌语气</span>
            <input value={form.brandTone} onChange={(event) => setField("brandTone", event.target.value)} />
          </label>

          <label className="field">
            <span>主推项目，每行一个</span>
            <textarea rows={4} value={form.mainProducts} onChange={(event) => setField("mainProducts", event.target.value)} />
          </label>

          <label className="field">
            <span>核心卖点，每行一个</span>
            <textarea rows={4} value={form.sellingPoints} onChange={(event) => setField("sellingPoints", event.target.value)} />
          </label>

          <div className="action-row">
            <button className="button" disabled={isSaving} type="submit">
              {isSaving ? "保存中..." : "保存门店资料"}
            </button>
          </div>

          {message ? <p className="muted">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </article>

      <article className="card">
        <h2>当前套餐</h2>
        <div className="history-list">
          {store.subscriptions.map((subscription) => (
            <article className="history-card" key={subscription.id}>
              <strong>{subscription.planName}</strong>
              <span>{subscription.status}</span>
              <span className="muted">
                {subscription.startAt} 至 {subscription.endAt}
              </span>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
