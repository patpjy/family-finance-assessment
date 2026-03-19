import { assessmentSchema } from "@/lib/assessment/schema";
import { labelMaps } from "@/lib/assessment/content";

export const runtime = "nodejs";

const enc = new TextEncoder();

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = assessmentSchema.parse(payload);
    const prompt = buildPrompt(input);

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-5.4";
    const effort = process.env.OPENAI_REASONING_EFFORT || "high";
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const endpoint = baseUrl.endsWith("/v1") ? `${baseUrl}/responses` : baseUrl.endsWith("/responses") ? baseUrl : `${baseUrl}/v1/responses`;

    if (!apiKey) {
      return Response.json({ error: "未配置 API Key" }, { status: 500 });
    }

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        stream: true,
        reasoning: { effort, summary: "auto" },
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
        text: { format: { type: "text" } },
      }),
    });

    if (!aiRes.ok || !aiRes.body) {
      const errText = await aiRes.text().catch(() => "AI API error");
      return Response.json({ error: errText }, { status: 502 });
    }

    // Pipe Responses API SSE → our simplified SSE
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";

            for (const line of parts) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(trimmed.slice(6));

                // Reasoning summary items (thinking)
                if (data.type === "response.reasoning_summary_text.delta") {
                  send({ type: "thinking", text: data.delta });
                }

                // Output text tokens
                if (data.type === "response.output_text.delta") {
                  send({ type: "token", text: data.delta });
                }

                // Done
                if (data.type === "response.completed") {
                  send({ type: "done" });
                }
              } catch {
                // skip
              }
            }
          }
        } catch {
          send({ type: "done" });
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求无效";
    return Response.json({ error: message }, { status: 400 });
  }
}

function buildPrompt(input: ReturnType<typeof assessmentSchema.parse>) {
  const data = [
    `活钱（现金/余额宝等）：${input.x1} 万元`,
    `投资的钱（股票/基金/理财等）：${input.x2} 万元`,
    `养老/公积金：${input.x3} 万元`,
    `自住房产：${input.x41} 万元`,
    `投资房产：${input.x42} 万元`,
    `房贷剩余：${input.d1} 万元`,
    `其他负债：${input.d2} 万元`,
    `家庭月收入：${input.incomeWan} 万元`,
    `家庭月结余：${input.saveWan} 万元`,
    `收入稳定性：${labelMaps.incomeStability[input.incomeStability]}`,
    `家庭结构：${labelMaps.familyStructure[input.familyStructure]}`,
    `父母赡养：${labelMaps.parentSupport[input.parentSupport]}`,
    `子女情况：${input.childrenStages.length ? input.childrenStages.map((s) => labelMaps.childrenStages[s]).join("、") : "暂无子女"}`,
    `保障状态：${labelMaps.insuranceStatus[input.insuranceStatus]}`,
    `年龄段：${labelMaps.ageRange[input.ageRange]}`,
    `城市级别：${labelMaps.cityTier[input.cityTier]}`,
    `主要目标：${input.goals.map((g) => labelMaps.goals[g]).join("、")}`,
    `风险偏好：${labelMaps.riskPreference[input.riskPreference]}`,
  ].join("\n");

  return `你是一位持有 CFP 认证的资深家庭财务顾问。用户填写了以下家庭财务数据，请你完成一份完整的家庭财务盘点分析。

【用户填写的原始数据】
${data}

请按以下结构输出详细分析。用中文，不要 Markdown 格式，用自然段落，语气像面对面咨询。

一、计算推演
逐步展示关键指标的计算过程。每项写清公式和结果：
总资产 = 各项资产之和
总负债、负债率 = 总负债÷总资产×100%
月支出 = 月收入-月结余
应急金覆盖月数 = 活钱÷月支出
储蓄率 = 月结余÷月收入×100%
房产占比 = 房产总值÷总资产×100%
财富等级判断（<50万起步，50-200万起步家庭，200-600万中产，600-1000万富裕，>1000万高净值）
压力测试：假设收入下降30%后的月结余和应急金可支撑时间

二、诊断与分析
详细分析财务健康状况，包括：应急金是否充足（双职工稳定收入标准6个月，单职工或不稳定9-12个月），负债是否健康（优秀<30%，健康30-50%，警戒50-70%，危险>70%），保障是否完善，房产占比是否合理（建议<60%），收入结构分析。

三、改善建议
给出 3-5 条具体的改善建议，每条建议要具体到金额和时间节点，结合用户的家庭结构、年龄段和主要目标。

四、2026 配置建议
给出资产配置比例（股票、债券、黄金、现金、保险、房产），解释配置逻辑，结合用户的风险偏好和目标。

要求：
- 只使用用户提供的数字，不编造
- 详尽深入，总长度 1500-2500 字
- 不要项目符号，不要列表格式
- 每个部分都要有充分的分析和解释

在以上详细分析全部完成后，请另起一行输出分隔标记 ===REPORT_DATA=== 然后紧跟一个纯JSON对象（不要用代码块包裹，不要加任何其他文字），严格遵循以下结构：
{"metrics":{"totalAssets":总资产万元数字,"totalDebt":总负债万元数字,"netWorth":净资产万元数字,"debtRatio":负债率百分比数字,"monthlyIncome":月收入万元数字,"monthlyExpense":月支出万元数字,"emergencyMonths":应急金月数保留1位小数,"savingsRate":储蓄率百分比数字保留1位小数,"propertyRatio":房产占比百分比数字保留1位小数,"wealthLevel":"财富等级中文"},"health":[{"name":"应急金","status":"good或warning或danger","text":"一句话评价"},{"name":"负债水平","status":"同上","text":"一句话评价"},{"name":"保障状态","status":"同上","text":"一句话评价"},{"name":"房产集中度","status":"同上","text":"一句话评价"}],"assets":[{"name":"活钱","value":数字},{"name":"投资","value":数字},{"name":"养老/公积金","value":数字},{"name":"自住房产","value":数字},{"name":"投资房产","value":数字}],"debts":[{"name":"房贷","value":数字},{"name":"其他负债","value":数字}],"allocation":[{"name":"类别名","pct":百分比整数}],"suggestions":[{"title":"简短标题","text":"具体建议内容包含金额和时间"}]}

JSON中所有数字都是纯数字不带单位，百分比是0-100的数字。`;
}
