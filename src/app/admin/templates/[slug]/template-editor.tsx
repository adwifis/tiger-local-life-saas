"use client";

import { useState } from "react";

type TemplateEditorProps = {
  template: {
    slug: string;
    name: string;
    categoryName: string;
    industry: string;
    scene: string;
    platform: string;
    description: string;
    sortOrder: number;
    status: "ACTIVE" | "DRAFT" | "DISABLED";
    generationCount: number;
    promptTemplate: {
      system: string;
      outputFormat: string;
      callToActionRule: string;
    };
  };
};

export function TemplateEditor({ template }: TemplateEditorProps) {
  const [form, setForm] = useState({
    description: template.description,
    sortOrder: String(template.sortOrder),
    status: template.status,
    promptSystem: template.promptTemplate.system,
    outputFormat: template.promptTemplate.outputFormat,
    callToActionRule: template.promptTemplate.callToActionRule
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
      const response = await fetch(`/api/admin/templates/${template.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: form.description,
          sortOrder: Number(form.sortOrder),
          status: form.status,
          promptSystem: form.promptSystem,
          outputFormat: form.outputFormat.split("\n").map((item) => item.trim()).filter(Boolean),
          callToActionRule: form.callToActionRule
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "TEMPLATE_UPDATE_FAILED");
      }

      setMessage("模板已更新。");
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
            <h2>模板配置</h2>
            <p className="muted">首发版先开放状态、排序和提示词配置，足够支持运营调优。</p>
          </div>
          <div className="quota-chip">
            <strong>{template.generationCount}</strong>
            <span>累计生成次数</span>
          </div>
        </div>

        <form className="marketing-form" onSubmit={handleSubmit}>
          <div className="store-brief">
            <span className="tag">{template.categoryName}</span>
            <span className="tag">{template.industry}</span>
            <span className="tag">{template.platform}</span>
            <span className="tag">{template.scene}</span>
          </div>

          <label className="field">
            <span>模板说明</span>
            <textarea rows={4} value={form.description} onChange={(event) => setField("description", event.target.value)} />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>状态</span>
              <select value={form.status} onChange={(event) => setField("status", event.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </label>

            <label className="field">
              <span>排序</span>
              <input type="number" min="0" value={form.sortOrder} onChange={(event) => setField("sortOrder", event.target.value)} />
            </label>
          </div>

          <label className="field">
            <span>System Prompt</span>
            <textarea rows={6} value={form.promptSystem} onChange={(event) => setField("promptSystem", event.target.value)} />
          </label>

          <label className="field">
            <span>输出结构，每行一个</span>
            <textarea rows={4} value={form.outputFormat} onChange={(event) => setField("outputFormat", event.target.value)} />
          </label>

          <label className="field">
            <span>行动引导规则</span>
            <textarea rows={3} value={form.callToActionRule} onChange={(event) => setField("callToActionRule", event.target.value)} />
          </label>

          <div className="action-row">
            <button className="button" disabled={isSaving} type="submit">
              {isSaving ? "保存中..." : "保存模板"}
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
            <strong>模板名</strong>
            <span>{template.name}</span>
          </article>
          <article className="history-card">
            <strong>Slug</strong>
            <span>{template.slug}</span>
          </article>
          <article className="history-card">
            <strong>当前状态</strong>
            <span>{template.status}</span>
          </article>
        </div>
      </article>
    </section>
  );
}
