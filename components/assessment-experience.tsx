"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { steps } from "@/lib/assessment/content";
import { demoFormState } from "@/lib/assessment/demo";

type FormState = typeof demoFormState;

interface ReportData {
  metrics: {
    totalAssets: number;
    totalDebt: number;
    netWorth: number;
    debtRatio: number;
    monthlyIncome: number;
    monthlyExpense: number;
    emergencyMonths: number;
    savingsRate: number;
    propertyRatio: number;
    wealthLevel: string;
  };
  health: Array<{ name: string; status: string; text: string }>;
  assets: Array<{ name: string; value: number }>;
  debts: Array<{ name: string; value: number }>;
  allocation: Array<{ name: string; pct: number }>;
  suggestions: Array<{ title: string; text: string }>;
}

const emptyForm: FormState = {
  x1: "", x2: "", x3: "", x41: "", x42: "",
  d1: "", d2: "", incomeWan: "", saveWan: "",
  incomeStability: "A", familyStructure: "A", parentSupport: "A",
  childrenStages: [], insuranceStatus: "A", ageRange: "A",
  cityTier: "A", goals: [], riskPreference: "A",
};

const ALLOC_COLORS = ["#2f5d50", "#4a9882", "#b07a32", "#6bb5a0", "#7a3a28", "#c9a96e", "#5c8a7d", "#d4a853"];
const SESSION_KEY = "assessment-session";

function statusIcon(s: string) {
  if (s === "good") return "\u2705";
  if (s === "warning") return "\u26A0\uFE0F";
  if (s === "danger") return "\u274C";
  return "\u2753";
}

export function AssessmentExperience() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [thinking, setThinking] = useState("");
  const [output, setOutput] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [modelChoice, setModelChoice] = useState<"deepseek" | "kimi" | "minimax" | "qwen" | "gpt5">("deepseek");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const thinkingScrolledUp = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);

  const progress = useMemo(() => `${((step + 1) / steps.length) * 100}%`, [step]);

  const updateField = (name: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const toggleMulti = (name: "childrenStages" | "goals", value: string) =>
    setForm((prev) => {
      const set = new Set(prev[name]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [name]: Array.from(set) };
    });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  // ── Restore state from sessionStorage on mount ──
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const s = JSON.parse(saved);
      if (s.thinking) setThinking(s.thinking);
      if (s.output) setOutput(s.output);
      if (s.done) setDone(s.done);
      if (s.reportData) setReportData(s.reportData);
      if (s.modelChoice) setModelChoice(s.modelChoice);
      // If was streaming when user left, mark as interrupted (not streaming, but show content)
      // streaming is NOT restored — the connection is lost
    } catch { /* ignore */ }
    mountedRef.current = true;
  }, []);

  // ── Save state to sessionStorage whenever it changes ──
  useEffect(() => {
    if (!mountedRef.current) return;
    if (!thinking && !output && !done) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      thinking, output, done, reportData, modelChoice,
    }));
  }, [thinking, output, done, reportData, modelChoice]);

  // ── Auto-scroll main AI panel ──
  useEffect(() => {
    const el = outputRef.current;
    if (!el || !streaming || userScrolledUp.current) return;
    el.scrollTop = el.scrollHeight;
  }, [output, thinking, streaming]);

  // ── Auto-scroll thinking box ──
  useEffect(() => {
    const el = thinkingRef.current;
    if (!el || thinkingScrolledUp.current) return;
    el.scrollTop = el.scrollHeight;
  }, [thinking]);

  // Parse report JSON when streaming finishes
  useEffect(() => {
    if (!done || !output) return;
    const marker = "===REPORT_DATA===";
    const idx = output.indexOf(marker);
    if (idx < 0) return;
    const jsonStr = output.slice(idx + marker.length).trim();
    try {
      setReportData(JSON.parse(jsonStr));
    } catch { /* ignore */ }
  }, [done, output]);

  // When done, scroll to report area (shows loading or report)
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(timer);
  }, [done]);

  // When report data arrives, scroll again to ensure it's in view
  useEffect(() => {
    if (!reportData) return;
    const timer = setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [reportData]);

  // Strip JSON block from visible text
  const marker = "===REPORT_DATA===";
  const markerIdx = output.indexOf(marker);
  const detailedOutput = markerIdx >= 0 ? output.slice(0, markerIdx).trimEnd() : output;

  const validateStep = () => {
    if (step === 0) return (["x1", "x2", "x3", "x41", "x42"] as const).every((f) => form[f] !== "");
    if (step === 1) return (["d1", "d2", "incomeWan", "saveWan"] as const).every((f) => form[f] !== "");
    return form.goals.length > 0;
  };

  const goNext = () => {
    if (!validateStep()) {
      setError(step === 2 ? "请至少选择 1 个主要目标。" : "请先完成当前步骤的必填项。");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goPrev = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  const handleReset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setForm(emptyForm);
    setStep(0);
    setError("");
    setStreaming(false);
    setThinking("");
    setOutput("");
    setDone(false);
    setReportData(null);
    sessionStorage.removeItem(SESSION_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setThinking("");
    setOutput("");
    setDone(false);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      setError("请至少选择 1 个主要目标。");
      return;
    }
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setError("");
    setStreaming(true);
    setThinking("");
    setOutput("");
    setDone(false);
    setReportData(null);
    userScrolledUp.current = false;
    thinkingScrolledUp.current = false;

    let hasContent = false;
    let receivedDone = false;

    try {
      const payload = {
        modelChoice,
        x1: Number(form.x1), x2: Number(form.x2), x3: Number(form.x3),
        x41: Number(form.x41), x42: Number(form.x42),
        d1: Number(form.d1), d2: Number(form.d2),
        incomeWan: Number(form.incomeWan), saveWan: Number(form.saveWan),
        incomeStability: form.incomeStability, familyStructure: form.familyStructure,
        parentSupport: form.parentSupport, childrenStages: form.childrenStages,
        insuranceStatus: form.insuranceStatus, ageRange: form.ageRange,
        cityTier: form.cityTier, goals: form.goals, riskPreference: form.riskPreference,
      };

      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || "请求失败");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === "thinking") { hasContent = true; setThinking((p) => p + data.text); }
            else if (data.type === "token") { hasContent = true; setOutput((p) => p + data.text); }
            else if (data.type === "done") { receivedDone = true; setDone(true); setStreaming(false); }
          } catch { /* skip */ }
        }
      }

      // Safety: if stream ended without explicit done event but we have content
      if (!receivedDone && hasContent) {
        setDone(true);
        setStreaming(false);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试。");
      setStreaming(false);
    }
  };

  const hasOutput = streaming || output || thinking;

  const aiStatus = done
    ? "推理分析完成"
    : output
      ? "正在输出分析..."
      : thinking
        ? "正在推理计算..."
        : "启动分析引擎...";

  const handleOutputScroll = () => {
    const el = outputRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 40;
  };

  const handleThinkingScroll = () => {
    const el = thinkingRef.current;
    if (!el) return;
    thinkingScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 20;
  };

  return (
    <div className="page-shell">
      <section className="hero panel">
        <div className="hero-copy">
          <h1>AI 家庭财务盘点</h1>
          <p className="hero-text">填写 3 步问卷，AI 实时计算并生成个性化深度分析报告。</p>
        </div>
        <div className="model-picker">
          <span className="model-picker-label">分析引擎</span>
          <div className="model-options">
            <label className={`model-opt${modelChoice === "deepseek" ? " active" : ""}`}>
              <input type="radio" name="model" checked={modelChoice === "deepseek"} onChange={() => setModelChoice("deepseek")} />
              <span className="model-opt-name">DeepSeek V3.2</span>
              <span className="model-opt-tag">推荐</span>
            </label>
            <label className={`model-opt${modelChoice === "kimi" ? " active" : ""}`}>
              <input type="radio" name="model" checked={modelChoice === "kimi"} onChange={() => setModelChoice("kimi")} />
              <span className="model-opt-name">Kimi K2.5</span>
            </label>
            <label className={`model-opt${modelChoice === "minimax" ? " active" : ""}`}>
              <input type="radio" name="model" checked={modelChoice === "minimax"} onChange={() => setModelChoice("minimax")} />
              <span className="model-opt-name">MiniMax M2.5</span>
            </label>
            <label className={`model-opt${modelChoice === "qwen" ? " active" : ""}`}>
              <input type="radio" name="model" checked={modelChoice === "qwen"} onChange={() => setModelChoice("qwen")} />
              <span className="model-opt-name">Qwen 3.5</span>
            </label>
            <label className={`model-opt${modelChoice === "gpt5" ? " active" : ""}`}>
              <input type="radio" name="model" checked={modelChoice === "gpt5"} onChange={() => setModelChoice("gpt5")} />
              <span className="model-opt-name">GPT-5.4</span>
              <span className="model-opt-tag pro">Pro</span>
            </label>
          </div>
        </div>
      </section>

      <div className={`two-col${hasOutput ? " has-output" : ""}`}>
        {/* ── Left: Form ── */}
        <main className="col-form">
          <section className="panel">
            <div className="section-head form-head">
              <div>
                <p className="section-tag">信息采集</p>
                <h2>家庭财务问卷</h2>
              </div>
              <div className="form-head-actions">
                <button className="ghost-btn" type="button" onClick={() => { setForm(demoFormState); setStep(0); setError(""); }}>填入示例</button>
                <button className="ghost-btn reset-btn" type="button" onClick={handleReset}>重新开始</button>
              </div>
            </div>

            <div className="progress-wrap">
              <div className="progress-bar"><span style={{ width: progress }} /></div>
              <div className="progress-label">第 {step + 1} / {steps.length} 步</div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="step-title">
                <span>{steps[step].title}</span>
                <h3>{steps[step].subtitle}</h3>
              </div>

              <div className="field-stack">
                {steps[step].fields.map((field) => {
                  if (field.type === "number") {
                    return (
                      <label className="field" key={field.name}>
                        <span>{field.label}</span>
                        {field.hint && <small>{field.hint}</small>}
                        <input type="number" min={field.min} step={field.step ?? 0.1}
                          value={form[field.name as keyof FormState] as string}
                          onChange={(e) => updateField(field.name as keyof FormState, e.target.value)} />
                      </label>
                    );
                  }
                  if (field.type === "single") {
                    return (
                      <fieldset className="field" key={field.name}>
                        <legend>{field.label}</legend>
                        <div className="choice-grid">
                          {field.options.map((opt) => (
                            <label key={opt.value} className="choice-item">
                              <input type="radio" name={field.name}
                                checked={form[field.name as keyof FormState] === opt.value}
                                onChange={() => updateField(field.name as keyof FormState, opt.value)} />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    );
                  }
                  return (
                    <fieldset className="field" key={field.name}>
                      <legend>{field.label}</legend>
                      <div className="choice-grid multi-grid">
                        {field.options.map((opt) => (
                          <label key={opt.value} className="choice-item">
                            <input type="checkbox"
                              checked={(form[field.name as keyof FormState] as string[]).includes(opt.value)}
                              onChange={() => toggleMulti(field.name as "childrenStages" | "goals", opt.value)} />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
              </div>

              {error ? <p className="form-tip error">{error}</p> : <p className="form-tip">完成当前步骤后继续。</p>}

              <div className="form-actions">
                <button type="button" className="ghost-btn" onClick={goPrev} disabled={step === 0 || streaming}>上一步</button>
                {step < steps.length - 1 ? (
                  <button type="button" className="primary-btn" onClick={goNext} disabled={streaming}>下一步</button>
                ) : (
                  <button type="button" className="primary-btn" disabled={streaming} onClick={handleSubmit}>
                    {streaming ? <><span className="spinner" />分析中...</> : "开始 AI 分析"}
                  </button>
                )}
              </div>
            </form>
          </section>
        </main>

        {/* ── Right: AI Streaming (analysis only) ── */}
        {hasOutput && (
          <aside className="col-output">
            <div className="panel ai-panel">
              <div className="ai-panel-header">
                <div className={`status-badge${done ? " done" : ""}`}>
                  {!done && <span className="spinner-sm" />}
                  {aiStatus}
                </div>
                <div className="ai-panel-actions">
                  {streaming && (
                    <button className="ghost-btn stop-btn" type="button" onClick={handleStop}>
                      终止分析
                    </button>
                  )}
                  {done && (
                    <button className="ghost-btn copy-btn" onClick={() => { navigator.clipboard.writeText(detailedOutput); showToast("已复制"); }}>
                      复制分析
                    </button>
                  )}
                </div>
              </div>

              <div className="ai-scroll" ref={outputRef} onScroll={handleOutputScroll}>
                {thinking && (
                  <details className="thinking-block" open={!output}>
                    <summary>
                      <span className={`phase-dot${output ? " completed" : " active"}`} />
                      推理过程
                    </summary>
                    <div className="thinking-text" ref={thinkingRef} onScroll={handleThinkingScroll}>{thinking}</div>
                  </details>
                )}
                {detailedOutput && (
                  <div className="output-section">
                    <div className="phase-label">
                      <span className={`phase-dot${done ? " completed" : " active"}`} />
                      {done ? "分析输出完成" : "正在输出分析..."}
                    </div>
                    <div className="ai-output">
                      {detailedOutput.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                      {streaming && <span className="cursor" />}
                      {streaming && <p className="ai-hint">分析完成后将自动生成报告，请稍候...</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Report area (appears after analysis done) ── */}
      {done && (
        <section className="report-full" ref={reportRef}>
          {!reportData ? (
            /* Loading state */
            <div className="report-loading">
              <span className="spinner-lg" />
              <p>正在生成家庭财务健康报告...</p>
              <button type="button" className="ghost-btn stop-btn" onClick={handleReset}>终止生成</button>
            </div>
          ) : (
            /* Full report */
            <>
              <div className="report-full-header">
                <div>
                  <p className="section-tag">分析报告</p>
                  <h2>家庭财务健康报告</h2>
                </div>
                <div className="report-badge">{reportData.metrics.wealthLevel}</div>
              </div>

              {/* ── Key metrics: 2 rows x 3 ── */}
              <div className="rpt-metrics">
                <div className="rpt-metric accent">
                  <span className="rpt-metric-label">总资产</span>
                  <div className="rpt-metric-value">{reportData.metrics.totalAssets}<small>万</small></div>
                </div>
                <div className="rpt-metric accent">
                  <span className="rpt-metric-label">净资产</span>
                  <div className="rpt-metric-value">{reportData.metrics.netWorth}<small>万</small></div>
                </div>
                <div className="rpt-metric">
                  <span className="rpt-metric-label">总负债</span>
                  <div className="rpt-metric-value">{reportData.metrics.totalDebt}<small>万</small></div>
                </div>
                <div className={`rpt-metric${reportData.metrics.debtRatio > 50 ? " warn" : ""}`}>
                  <span className="rpt-metric-label">负债率</span>
                  <div className="rpt-metric-value">{reportData.metrics.debtRatio.toFixed(1)}<small>%</small></div>
                </div>
                <div className={`rpt-metric${reportData.metrics.emergencyMonths < 6 ? " warn" : ""}`}>
                  <span className="rpt-metric-label">应急金</span>
                  <div className="rpt-metric-value">{reportData.metrics.emergencyMonths.toFixed(1)}<small>个月</small></div>
                </div>
                <div className="rpt-metric">
                  <span className="rpt-metric-label">储蓄率</span>
                  <div className="rpt-metric-value">{reportData.metrics.savingsRate.toFixed(1)}<small>%</small></div>
                </div>
              </div>

              {/* ── Health + Tables side by side ── */}
              <div className="rpt-two-col">
                <div className="rpt-card">
                  <h3 className="rpt-card-title">健康诊断</h3>
                  <div className="health-list">
                    {reportData.health.map((h, i) => (
                      <div key={i} className={`health-row health-${h.status}`}>
                        <span className="health-icon">{statusIcon(h.status)}</span>
                        <span className="health-name">{h.name}</span>
                        <span className="health-text">{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rpt-card">
                  <h3 className="rpt-card-title">资产负债明细</h3>
                  <table className="rpt-table">
                    <colgroup><col style={{ width: "40%" }} /><col style={{ width: "35%" }} /><col style={{ width: "25%" }} /></colgroup>
                    <thead><tr><th>资产项目</th><th>金额（万）</th><th>占比</th></tr></thead>
                    <tbody>
                      {reportData.assets.map((a, i) => (
                        <tr key={i}>
                          <td>{a.name}</td>
                          <td className="num">{a.value}</td>
                          <td className="num">{reportData.metrics.totalAssets > 0 ? `${((a.value / reportData.metrics.totalAssets) * 100).toFixed(1)}%` : "-"}</td>
                        </tr>
                      ))}
                      <tr className="row-total"><td>资产合计</td><td className="num">{reportData.metrics.totalAssets}</td><td className="num">100%</td></tr>
                    </tbody>
                  </table>

                  {reportData.debts.length > 0 && (
                    <table className="rpt-table rpt-table-debt">
                      <colgroup><col style={{ width: "40%" }} /><col style={{ width: "60%" }} /></colgroup>
                      <thead><tr><th>负债项目</th><th>金额（万）</th></tr></thead>
                      <tbody>
                        {reportData.debts.map((d, i) => (
                          <tr key={i}><td>{d.name}</td><td className="num">{d.value}</td></tr>
                        ))}
                        <tr className="row-total"><td>负债合计</td><td className="num">{reportData.metrics.totalDebt}</td></tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── Monthly cash flow ── */}
              <div className="rpt-card">
                <h3 className="rpt-card-title">月度现金流</h3>
                <div className="cashflow">
                  <CashFlowRow label="月收入" value={reportData.metrics.monthlyIncome} pct={100} type="income" />
                  <CashFlowRow label="月支出" value={reportData.metrics.monthlyExpense}
                    pct={reportData.metrics.monthlyIncome > 0 ? reportData.metrics.monthlyExpense / reportData.metrics.monthlyIncome * 100 : 0} type="expense" />
                  <CashFlowRow label="月结余" value={+(reportData.metrics.monthlyIncome - reportData.metrics.monthlyExpense).toFixed(2)}
                    pct={reportData.metrics.monthlyIncome > 0 ? (reportData.metrics.monthlyIncome - reportData.metrics.monthlyExpense) / reportData.metrics.monthlyIncome * 100 : 0} type="saving" />
                </div>
              </div>

              {/* ── Allocation chart ── */}
              <div className="rpt-card">
                <h3 className="rpt-card-title">2026 资产配置建议</h3>
                <div className="alloc-bar">
                  {reportData.allocation.map((a, i) => (
                    <div key={i} className="alloc-seg"
                      style={{ width: `${a.pct}%`, background: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                      title={`${a.name} ${a.pct}%`}>
                      {a.pct >= 10 && <span>{a.pct}%</span>}
                    </div>
                  ))}
                </div>
                <div className="alloc-legend">
                  {reportData.allocation.map((a, i) => (
                    <div key={i} className="alloc-legend-item">
                      <span className="alloc-dot" style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                      {a.name} <strong>{a.pct}%</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Suggestions ── */}
              <div className="rpt-card">
                <h3 className="rpt-card-title">行动建议</h3>
                <div className="sug-grid">
                  {reportData.suggestions.map((s, i) => (
                    <div key={i} className="sug-item">
                      <div className="sug-num">{i + 1}</div>
                      <div>
                        <div className="sug-title">{s.title}</div>
                        <div className="sug-text">{s.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rpt-footer">
                <button type="button" className="primary-btn" onClick={handleReset}>重新开始评估</button>
              </div>
            </>
          )}
        </section>
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}

/* ── Sub-components ── */
function CashFlowRow({ label, value, pct, type }: { label: string; value: number; pct: number; type: "income" | "expense" | "saving" }) {
  return (
    <div className="cf-row">
      <span className="cf-label">{label}</span>
      <div className="cf-bar-wrap">
        <div className={`cf-bar cf-${type}`} style={{ width: `${Math.max(pct, 0)}%` }} />
      </div>
      <span className="cf-val">{value} 万</span>
    </div>
  );
}
