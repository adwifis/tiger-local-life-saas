"use client";

import { useMemo, useState } from "react";

type RequestStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function statusLabel(status: string) {
  if (status === "PENDING") {
    return "待审核";
  }

  if (status === "APPROVED") {
    return "已通过";
  }

  if (status === "REJECTED") {
    return "已驳回";
  }

  return status;
}

function statusBadgeClass(status: string) {
  if (status === "APPROVED") {
    return "badge ok";
  }

  if (status === "REJECTED") {
    return "badge danger";
  }

  return "badge warning";
}

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
      note: string;
      reviewNote: string;
      createdAt: string;
      reviewedAt: string;
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
  const [activeFilter, setActiveFilter] = useState<RequestStatusFilter>("ALL");

  const visibleRequests = useMemo(
    () => props.agent.provisionRequests.filter((request) => activeFilter === "ALL" || request.status === activeFilter),
    [activeFilter, props.agent.provisionRequests]
  );

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
      setActiveFilter("PENDING");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="card">
      <h2>提交套餐开通申请</h2>
      <p className="muted">代理先提单，平台后台审核通过后再正式开通，减少线下消息丢单和口头确认误差。</p>

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
          <span>申请备注</span>
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

      <div className="filter-row">
        {[
          { key: "ALL", label: "全部" },
          { key: "PENDING", label: "待审核" },
          { key: "APPROVED", label: "已通过" },
          { key: "REJECTED", label: "已驳回" }
        ].map((item) => (
          <button
            className={activeFilter === item.key ? "button" : "button secondary"}
            key={item.key}
            onClick={() => setActiveFilter(item.key as RequestStatusFilter)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="history-list">
        {visibleRequests.length === 0 ? <p className="muted">当前还没有符合条件的申请记录。</p> : null}

        {visibleRequests.map((request) => (
          <article className="history-card" key={request.id}>
            <strong>{request.storeName}</strong>
            <div className="inline-meta">
              <span>{request.planName}</span>
              <span>{request.months} 个月</span>
              <span className={statusBadgeClass(request.status)}>{statusLabel(request.status)}</span>
            </div>
            {request.note ? <span className="muted">申请备注：{request.note}</span> : null}
            {request.reviewNote ? <span className="muted">平台反馈：{request.reviewNote}</span> : null}
            <span className="muted">
              提交于 {request.createdAt}
              {request.reviewedAt ? ` · 处理于 ${request.reviewedAt}` : ""}
            </span>
          </article>
        ))}
      </div>
    </article>
  );
}
