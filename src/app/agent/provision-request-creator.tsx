"use client";

import { useState } from "react";

export function ProvisionRequestCreator(props: {
  agent: {
    id: string;
    merchants: Array<{
      id: string;
      storeSlug: string;
      storeName: string;
      city: string;
      industry: string;
    }>;
    plans: Array<{
      id: string;
      name: string;
      code: string;
      monthlyQuota: number;
      priceCents: number;
    }>;
    provisionRequests: Array<{
      id: string;
      storeName: string;
      planName: string;
      months: number;
      status: string;
      createdAt: string;
    }>;
  };
}) {
  const [storeSlug, setStoreSlug] = useState(props.agent.merchants[0]?.storeSlug ?? "");
  const [planCode, setPlanCode] = useState(props.agent.plans[0]?.code ?? "");
  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedMerchant = props.agent.merchants.find((item) => item.storeSlug === storeSlug);

    if (!selectedMerchant) {
      setError("STORE_NOT_FOUND");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/agent/provision-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          storeSlug: selectedMerchant.storeSlug,
          requestedByUserEmail: "agent@quoteai.local",
          planCode,
          months: Number(months),
          note
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        provisionRequest?: { storeName: string; planName: string; status: string };
      };

      if (!response.ok) {
        throw new Error(payload.error || "PROVISION_REQUEST_CREATE_FAILED");
      }

      setMessage(`${payload.provisionRequest?.storeName || "门店"} 的 ${payload.provisionRequest?.planName || ""} 开通申请已提交。`);
      setNote("");
      setMonths("1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="card">
      <h2>提交套餐开通申请</h2>
      <p className="muted">代理先提单，平台后台审核通过后再正式开通，避免线下消息丢失。</p>

      <form className="marketing-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>客户门店</span>
          <select value={storeSlug} onChange={(event) => setStoreSlug(event.target.value)}>
            {props.agent.merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.storeSlug}>
                {merchant.storeName} · {merchant.city} · {merchant.industry}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>套餐</span>
          <select value={planCode} onChange={(event) => setPlanCode(event.target.value)}>
            {props.agent.plans.map((plan) => (
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

        <label className="field">
          <span>备注</span>
          <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>

        <div className="action-row">
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "提交中..." : "提交开通申请"}
          </button>
        </div>

        {message ? <p className="muted">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>

      <div className="history-list">
        {props.agent.provisionRequests.map((request) => (
          <article className="history-card" key={request.id}>
            <strong>{request.storeName}</strong>
            <span>
              {request.planName} · {request.months} 个月 · {request.status}
            </span>
            <span className="muted">{request.createdAt}</span>
          </article>
        ))}
      </div>
    </article>
  );
}
