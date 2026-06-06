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

export function ProvisionRequestReviewer(props: {
  requests: Array<{
    id: string;
    storeName: string;
    agentName: string;
    planName: string;
    months: number;
    status: string;
    note: string;
    reviewNote: string;
    createdAt: string;
    reviewedAt: string;
  }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RequestStatusFilter>("PENDING");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const visibleRequests = useMemo(
    () => props.requests.filter((request) => activeFilter === "ALL" || request.status === activeFilter),
    [activeFilter, props.requests]
  );

  async function reviewRequest(requestId: string, decision: "APPROVE" | "REJECT") {
    setLoadingId(requestId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/provision-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          decision,
          reviewedByAdminEmail: "admin@quoteai.local",
          reviewNote: reviewNotes[requestId]?.trim() || undefined
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "PROVISION_REQUEST_REVIEW_FAILED");
      }

      setMessage(decision === "APPROVE" ? "申请已审核通过并开通。刷新后可看到最新状态。" : "申请已驳回。刷新后可看到最新状态。");
      setReviewNotes((current) => ({ ...current, [requestId]: "" }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "审核失败。");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <article className="card">
      <h2>套餐开通申请队列</h2>
      <p className="muted">先看待审核，再回溯已通过和已驳回记录，方便平台运营复盘和代理对账。</p>

      <div className="filter-row">
        {[
          { key: "PENDING", label: "待审核" },
          { key: "APPROVED", label: "已通过" },
          { key: "REJECTED", label: "已驳回" },
          { key: "ALL", label: "全部" }
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
        {visibleRequests.length === 0 ? <p className="muted">当前筛选条件下还没有申请记录。</p> : null}

        {visibleRequests.map((request) => (
          <article className="history-card" key={request.id}>
            <strong>
              {request.storeName} · {request.planName}
            </strong>
            <div className="inline-meta">
              <span>{request.agentName}</span>
              <span>{request.months} 个月</span>
              <span className={statusBadgeClass(request.status)}>{statusLabel(request.status)}</span>
            </div>
            {request.note ? <span className="muted">代理备注：{request.note}</span> : null}
            {request.reviewNote ? <span className="muted">审核说明：{request.reviewNote}</span> : null}
            <span className="muted">
              提交于 {request.createdAt}
              {request.reviewedAt ? ` · 处理于 ${request.reviewedAt}` : ""}
            </span>

            {request.status === "PENDING" ? (
              <>
                <label className="field">
                  <span>审核说明</span>
                  <textarea
                    maxLength={200}
                    placeholder="可填写收款确认、开通备注或驳回原因"
                    rows={3}
                    value={reviewNotes[request.id] ?? ""}
                    onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                  />
                </label>
                <div className="action-row">
                  <button className="button" disabled={loadingId === request.id} onClick={() => reviewRequest(request.id, "APPROVE")} type="button">
                    {loadingId === request.id ? "处理中..." : "通过并开通"}
                  </button>
                  <button className="button secondary" disabled={loadingId === request.id} onClick={() => reviewRequest(request.id, "REJECT")} type="button">
                    驳回申请
                  </button>
                </div>
              </>
            ) : null}
          </article>
        ))}
      </div>

      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </article>
  );
}
