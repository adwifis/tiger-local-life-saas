"use client";

import { useState } from "react";

type PlanEditorProps = {
  plan: {
    code: string;
    name: string;
    roleScope: "MERCHANT" | "AGENT";
    monthlyQuota: number;
    priceCents: number;
    isActive: boolean;
    subscriptionCount: number;
    createdAt: string;
    updatedAt: string;
  };
};

export function PlanEditor({ plan }: PlanEditorProps) {
  const [form, setForm] = useState({
    name: plan.name,
    roleScope: plan.roleScope,
    monthlyQuota: String(plan.monthlyQuota),
    priceCents: String(plan.priceCents),
    isActive: plan.isActive ? "true" : "false"
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
      const response = await fetch(`/api/admin/plans/${plan.code}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          roleScope: form.roleScope,
          monthlyQuota: Number(form.monthlyQuota),
          priceCents: Number(form.priceCents),
          isActive: form.isActive === "true"
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "PLAN_UPDATE_FAILED");
      }

      setMessage("套餐已更新。");
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
            <h2>套餐配置</h2>
            <p className="muted">优先开放价格、额度、角色范围和启停状态，足够支撑首发版人工售卖。</p>
          </div>
          <div className="quota-chip">
            <strong>{plan.subscriptionCount}</strong>
            <span>累计开通次数</span>
          </div>
        </div>

        <form className="marketing-form" onSubmit={handleSubmit}>
          <div className="store-brief">
            <span className="tag">{plan.code}</span>
            <span className="tag">{plan.roleScope}</span>
            <span className="tag">{plan.isActive ? "ACTIVE" : "DISABLED"}</span>
          </div>

          <label className="field">
            <span>套餐名称</span>
            <input value={form.name} onChange={(event) => setField("name", event.target.value)} />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>适用角色</span>
              <select value={form.roleScope} onChange={(event) => setField("roleScope", event.target.value)}>
                <option value="MERCHANT">MERCHANT</option>
                <option value="AGENT">AGENT</option>
              </select>
            </label>

            <label className="field">
              <span>是否启用</span>
              <select value={form.isActive} onChange={(event) => setField("isActive", event.target.value)}>
                <option value="true">启用</option>
                <option value="false">停用</option>
              </select>
            </label>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>月额度</span>
              <input type="number" min="1" value={form.monthlyQuota} onChange={(event) => setField("monthlyQuota", event.target.value)} />
            </label>

            <label className="field">
              <span>价格（分）</span>
              <input type="number" min="0" value={form.priceCents} onChange={(event) => setField("priceCents", event.target.value)} />
            </label>
          </div>

          <div className="action-row">
            <button className="button" disabled={isSaving} type="submit">
              {isSaving ? "保存中..." : "保存套餐"}
            </button>
          </div>

          {message ? <p className="muted">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </article>

      <article className="card">
        <h2>运营说明</h2>
        <div className="history-list">
          <article className="history-card">
            <strong>套餐编码</strong>
            <span>{plan.code}</span>
          </article>
          <article className="history-card">
            <strong>创建日期</strong>
            <span>{plan.createdAt}</span>
          </article>
          <article className="history-card">
            <strong>最近更新</strong>
            <span>{plan.updatedAt}</span>
          </article>
        </div>
      </article>
    </section>
  );
}
