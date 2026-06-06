"use client";

import { useMemo, useState } from "react";

type StoreOption = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  city: string;
  district: string | null;
  businessArea: string | null;
  targetAudience: string | null;
  brandTone: string | null;
  remainingQuota: number;
  monthlyLimit: number;
  usedCount: number;
  hasAgent: boolean;
};

type TemplateField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "single_select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

type TemplateOption = {
  id: string;
  slug: string;
  name: string;
  scene: string;
  platform: string;
  description: string;
  inputSchema: TemplateField[];
};

type RecentGeneration = {
  id: string;
  title: string | null;
  storeName: string;
  templateName: string;
  status: string;
  model: string;
  createdAt: string;
};

type GenerateResponse = {
  id: string;
  title: string | null;
  status: string;
  model: string;
  executionMode: string;
  outputText: string;
  errorMessage: string | null;
  createdAt: string;
  quota: {
    monthlyLimit: number;
    usedCount: number;
    remainingCount: number;
  };
};

export function MarketingConsole(props: {
  stores: StoreOption[];
  templates: TemplateOption[];
  recentGenerations: RecentGeneration[];
}) {
  const [storeSlug, setStoreSlug] = useState(props.stores[0]?.slug ?? "");
  const [templateSlug, setTemplateSlug] = useState(props.templates[0]?.slug ?? "");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [localStores, setLocalStores] = useState(props.stores);

  const selectedStore = useMemo(
    () => localStores.find((item) => item.slug === storeSlug) ?? localStores[0] ?? null,
    [localStores, storeSlug]
  );
  const selectedTemplate = useMemo(
    () => props.templates.find((item) => item.slug === templateSlug) ?? props.templates[0] ?? null,
    [props.templates, templateSlug]
  );

  function updateField(fieldId: string, value: string) {
    setFormValues((current) => ({
      ...current,
      [fieldId]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedStore || !selectedTemplate) {
      setSubmitError("请选择门店和模板。");
      return;
    }

    const nextInputs = Object.fromEntries(
      selectedTemplate.inputSchema.map((field) => [field.id, formValues[field.id] ?? ""])
    );

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          storeSlug: selectedStore.slug,
          templateSlug: selectedTemplate.slug,
          inputs: nextInputs
        })
      });

      const payload = (await response.json()) as GenerateResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "GENERATE_FAILED");
      }

      setResult(payload);
      setLocalStores((current) =>
        current.map((item) =>
          item.slug === selectedStore.slug
            ? {
                ...item,
                usedCount: payload.quota.usedCount,
                remainingQuota: payload.quota.remainingCount,
                monthlyLimit: payload.quota.monthlyLimit
              }
            : item
        )
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section grid-two">
      <article className="card">
        <div className="panel-head">
          <div>
            <h2>商家生成工作台</h2>
            <p className="muted">
              先用真实门店上下文把 4 类核心生成器跑通，再继续扩代理和后台。
            </p>
          </div>
          {selectedStore ? (
            <div className="quota-chip">
              <strong>{selectedStore.remainingQuota}</strong>
              <span>剩余额度 / {selectedStore.monthlyLimit}</span>
            </div>
          ) : null}
        </div>

        <form className="marketing-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span>门店</span>
              <select value={storeSlug} onChange={(event) => setStoreSlug(event.target.value)}>
                {localStores.map((store) => (
                  <option key={store.id} value={store.slug}>
                    {store.name} · {store.city} · 剩余 {store.remainingQuota}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>模板</span>
              <select value={templateSlug} onChange={(event) => setTemplateSlug(event.target.value)}>
                {props.templates.map((template) => (
                  <option key={template.id} value={template.slug}>
                    {template.name} · {template.platform}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedStore ? (
            <div className="store-brief">
              <span className="tag">{selectedStore.industry}</span>
              <span className="tag">{selectedStore.city}{selectedStore.businessArea ? ` · ${selectedStore.businessArea}` : ""}</span>
              <span className="tag">{selectedStore.hasAgent ? "代理托管" : "商家直用"}</span>
            </div>
          ) : null}

          {selectedTemplate ? (
            <div className="template-brief">
              <h3>{selectedTemplate.name}</h3>
              <p>{selectedTemplate.description}</p>
            </div>
          ) : null}

          <div className="field-stack">
            {selectedTemplate?.inputSchema.map((field) => {
              const value = formValues[field.id] ?? "";

              if (field.type === "textarea") {
                return (
                  <label className="field" key={field.id}>
                    <span>{field.label}</span>
                    <textarea
                      rows={4}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={value}
                      onChange={(event) => updateField(field.id, event.target.value)}
                    />
                  </label>
                );
              }

              if (field.type === "single_select") {
                return (
                  <label className="field" key={field.id}>
                    <span>{field.label}</span>
                    <select
                      required={field.required}
                      value={value}
                      onChange={(event) => updateField(field.id, event.target.value)}
                    >
                      <option value="">请选择</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <label className="field" key={field.id}>
                  <span>{field.label}</span>
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={value}
                    onChange={(event) => updateField(field.id, event.target.value)}
                  />
                </label>
              );
            })}
          </div>

          <div className="action-row">
            <button className="button" disabled={isSubmitting || !selectedStore || selectedStore.remainingQuota <= 0} type="submit">
              {isSubmitting ? "生成中..." : "生成营销内容"}
            </button>
            {selectedStore?.remainingQuota === 0 ? (
              <span className="badge warning">当前门店额度已用完，需要后台开通套餐</span>
            ) : null}
          </div>

          {submitError ? <p className="error-text">{submitError}</p> : null}
        </form>
      </article>

      <article className="card">
        <h2>最近结果</h2>
        {result ? (
          <div className="result-panel">
            <div className="result-meta">
              <span className="badge ok">{result.executionMode}</span>
              <span className="muted">{result.model}</span>
              <span className="muted">剩余 {result.quota.remainingCount}</span>
            </div>
            <pre>{result.outputText}</pre>
          </div>
        ) : (
          <p className="muted">先完成一次生成，右侧会显示最新结果和额度变化。</p>
        )}

        <div className="history-list">
          {props.recentGenerations.map((item) => (
            <article className="history-card" key={item.id}>
              <strong>{item.templateName}</strong>
              <span>{item.storeName}</span>
              <span className="muted">
                {item.status} · {item.model}
              </span>
              <span className="muted">{item.createdAt}</span>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
