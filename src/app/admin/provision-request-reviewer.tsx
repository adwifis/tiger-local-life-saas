"use client";

import { useState } from "react";

export function ProvisionRequestReviewer(props: {
  requests: Array<{
    id: string;
    storeName: string;
    agentName: string;
    planName: string;
    months: number;
    status: string;
    note: string;
    createdAt: string;
  }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
          reviewedByAdminEmail: "admin@quoteai.local"
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "PROVISION_REQUEST_REVIEW_FAILED");
      }

      setMessage(decision === "APPROVE" ? "申请已审核通过并开通。刷新后可看到最新状态。" : "申请已驳回。刷新后可看到最新状态。");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "审核失败。");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <article className="card">
      <h2>待审核开通申请</h2>
      <div className="history-list">
        {props.requests.map((request) => (
          <article className="history-card" key={request.id}>
            <strong>
              {request.storeName} · {request.planName}
            </strong>
            <span>
              {request.agentName} · {request.months} 个月 · {request.status}
            </span>
            {request.note ? <span className="muted">{request.note}</span> : null}
            <span className="muted">{request.createdAt}</span>
            {request.status === "PENDING" ? (
              <div className="action-row">
                <button className="button" disabled={loadingId === request.id} onClick={() => reviewRequest(request.id, "APPROVE")} type="button">
                  {loadingId === request.id ? "处理中..." : "通过并开通"}
                </button>
                <button className="button secondary" disabled={loadingId === request.id} onClick={() => reviewRequest(request.id, "REJECT")} type="button">
                  驳回
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </article>
  );
}
