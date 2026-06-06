"use client";

import { useState } from "react";

type AdminStoreOption = {
  id: string;
  slug: string;
  name: string;
  city: string;
  industry: string;
  status: string;
  remainingQuota: number;
};

type PlanOption = {
  id: string;
  name: string;
  code: string;
  roleScope: string;
  monthlyQuota: number;
  priceCents: number;
};

export function SubscriptionOpener(props: {
  stores: AdminStoreOption[];
  plans: PlanOption[];
}) {
  const [storeSlug, setStoreSlug] = useState(props.stores[0]?.slug ?? "");
  const [planCode, setPlanCode] = useState(props.plans[0]?.code ?? "");
  const [months, setMonths] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/subscriptions/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          storeSlug,
          planCode,
          months: Number(months),
          openedByAdminEmail: "admin@quoteai.local"
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        subscription?: { storeName: string; planName: string; endAt: string };
        quota?: { remainingCount: number };
      };

      if (!response.ok) {
        throw new Error(payload.error || "SUBSCRIPTION_OPEN_FAILED");
      }

      setMessage(
        `${payload.subscription?.storeName || "门店"} 已开通 ${payload.subscription?.planName || ""}，到期 ${payload.subscription?.endAt || "-"}，剩余额度 ${payload.quota?.remainingCount ?? 0}。`
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "开通失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="card">
      <h2>手工开通套餐</h2>
      <p className="muted">首发版先用人工收款 + 后台开通，不把支付接入挡在上线前面。</p>

      <form className="marketing-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>门店</span>
          <select value={storeSlug} onChange={(event) => setStoreSlug(event.target.value)}>
            {props.stores.map((store) => (
              <option key={store.id} value={store.slug}>
                {store.name} · {store.city} · 剩余 {store.remainingQuota}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>套餐</span>
          <select value={planCode} onChange={(event) => setPlanCode(event.target.value)}>
            {props.plans.map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name} · {plan.monthlyQuota} 次 / 月
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>开通月数</span>
          <input min="1" max="12" type="number" value={months} onChange={(event) => setMonths(event.target.value)} />
        </label>

        <div className="action-row">
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "开通中..." : "确认开通"}
          </button>
        </div>

        {message ? <p className="muted">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </article>
  );
}
