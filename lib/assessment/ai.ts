import { labelMaps } from "@/lib/assessment/content";
import { fmtWan, fmtPct } from "@/lib/assessment/format";
import type { Metrics } from "@/lib/assessment/metrics";

export async function getStrategicReason(computed: Metrics) {
  const fallbackText = getFallbackReason(computed);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.4";
  if (!apiKey) return { text: fallbackText, usedAi: false, model: null };

  try {
    const endpoint = resolveEndpoint();
    const prompt = buildPrompt(computed);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "medium" },
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
        text: { format: { type: "text" } },
      }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = await response.json();
    const text = extractOutputText(data)?.trim();
    if (!text) throw new Error("Empty response");
    return { text, usedAi: true, model };
  } catch {
    return { text: fallbackText, usedAi: false, model };
  }
}

function buildPrompt(c: Metrics) {
  return [
    "你是家庭财富配置分析顾问。",
    "请只输出中文正文，不要标题，不要项目符号，不要 Markdown。",
    "请写 2 段到 4 段，总长度 180 到 320 字。",
    "不要使用比喻，不要夸张，不要编造新的数字。",
    "必须结合以下信息解释 2026 年资产配置原因：",
    `财富等级：${c.wealthLevel}`,
    `主观风险偏好：${labelMaps.riskPreference[c.input.riskPreference]}`,
    `实际风险承受能力：${c.actualRiskCapacity}`,
    `总资产：${fmtWan(c.A)} 万元`,
    `房产占比：${c.P4 !== null ? `${fmtPct(c.P4)}%` : "—"}`,
    `总负债率：${c.L1 !== null ? `${fmtPct(c.L1)}%` : "—"}`,
    `应急金覆盖月数：${c.Z !== null ? `${c.Z} 个月` : "—"}`,
    `主要目标：${c.goalsText}`,
    `建议配置：股票/基金 ${c.allocation.stocks}%，债券/固收 ${c.allocation.bonds}%，黄金/贵金属 ${c.allocation.gold}%，现金/货币基金 ${c.allocation.cash}%，保险/养老产品 ${c.allocation.insurance}%，投资性房产 ${c.allocation.investmentProperty}%，其他/另类 ${c.allocation.other}%。`,
    "专业参考要点：2026 年债券/固收是核心配置，原因是低通胀和政策宽松环境下兼顾稳健收益与资本利得空间；黄金用于对冲货币宽松和全球财政风险；现金只保留流动性需要；投资性房产整体低配。",
    "请把解释写得通俗、克制、专业。",
  ].join("\n");
}

function getFallbackReason(c: Metrics) {
  return [
    `根据您的${labelMaps.riskPreference[c.input.riskPreference]}风险偏好，以及目前${c.wealthLevel}的资产规模，这次配置把重心放在"先稳住家庭底盘，再追求效率"。债券/固收仍然是组合里的主力，因为它更适合在当前环境下承担稳健收益和回撤控制的任务。`,
    `黄金维持 ${c.allocation.gold}% 的核心仓位，主要作用是对冲宏观波动和货币宽松带来的不确定性。现金/货币基金只保留 ${c.allocation.cash}% 左右，用来满足日常流动性和短期支出，不建议长期把过多资产停留在低收益现金上。`,
    c.condP4
      ? `您目前房产占比较高，因此投资性房产配置建议维持低配甚至不再新增，后续更适合把新增资金逐步转向流动性更好、便于分散风险的债券、黄金和保险类资产。`
      : `您当前的房产占比还在可管理范围内，因此新增可投资资金更适合优先进入债券、黄金和保险类资产，而不是继续加重单一资产集中度。`,
  ].join("\n\n");
}

function resolveEndpoint() {
  const explicit = process.env.OPENAI_RESPONSES_URL;
  if (explicit) return explicit;
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (base.endsWith("/responses")) return base;
  if (base.endsWith("/v1")) return `${base}/responses`;
  return `${base}/v1/responses`;
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as { output_text?: unknown; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof maybe.output_text === "string" && maybe.output_text.trim()) return maybe.output_text;
  const chunks = maybe.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text?.trim()).filter(Boolean);
  return chunks && chunks.length ? chunks.join("\n") : null;
}
