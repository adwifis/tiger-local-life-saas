"use client";

import { useState } from "react";

export function MerchantCreator(props: {
  agent: {
    id: string;
    companyName: string;
  };
}) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    city: "",
    district: "",
    businessArea: "",
    targetAudience: "",
    brandTone: "",
    contactPhone: "",
    mainProducts: "",
    sellingPoints: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/agent/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agentId: props.agent.id,
          createdByUserEmail: "agent@quoteai.local",
          name: form.name,
          industry: form.industry,
          city: form.city,
          district: form.district,
          businessArea: form.businessArea,
          targetAudience: form.targetAudience,
          brandTone: form.brandTone,
          contactPhone: form.contactPhone,
          mainProducts: form.mainProducts.split("\n").map((item) => item.trim()).filter(Boolean),
          sellingPoints: form.sellingPoints.split("\n").map((item) => item.trim()).filter(Boolean)
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        merchant?: { name: string; city: string; industry: string; slug: string };
      };

      if (!response.ok) {
        throw new Error(payload.error || "AGENT_MERCHANT_CREATE_FAILED");
      }

      setMessage(`${payload.merchant?.name || "客户门店"} 已创建，可回到营销工作台继续配置和开通套餐。`);
      setForm({
        name: "",
        industry: "",
        city: "",
        district: "",
        businessArea: "",
        targetAudience: "",
        brandTone: "",
        contactPhone: "",
        mainProducts: "",
        sellingPoints: ""
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="card">
      <div className="panel-head">
        <div>
          <h2>代理新增客户门店</h2>
          <p className="muted">先把客户资料建进系统，再由平台开通套餐，代理就能代客户持续生成内容。</p>
        </div>
        <span className="badge ok">{props.agent.companyName}</span>
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
            <span>联系电话</span>
            <input value={form.contactPhone} onChange={(event) => setField("contactPhone", event.target.value)} />
          </label>
          <label className="field">
            <span>区域</span>
            <input value={form.district} onChange={(event) => setField("district", event.target.value)} />
          </label>
          <label className="field">
            <span>商圈</span>
            <input value={form.businessArea} onChange={(event) => setField("businessArea", event.target.value)} />
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
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "创建中..." : "创建客户门店"}
          </button>
        </div>

        {message ? <p className="muted">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </article>
  );
}
