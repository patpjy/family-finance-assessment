import { labelMaps } from "@/lib/assessment/content";
import { fmtWan, fmtPct, fmtYuan, pctOrDash, escapeHtml } from "@/lib/assessment/format";
import type { Metrics } from "@/lib/assessment/metrics";

const priorityOrder = "现金流止血 → 应急资金 → 核心保障 → 高息债务 → 资产配置优化";

export function renderReportHtml(c: Metrics, strategicReason: string, usedAi: boolean, model: string | null) {
  return `
    <div class="report-stack">
      ${renderOverview(c)}
      ${renderSection1(c)}
      ${renderSection2(c)}
      ${renderSection3(c)}
      ${renderSection4(c)}
      ${renderSection5(c, strategicReason, usedAi, model)}
      ${renderSection6(c)}
    </div>
  `;
}

// --- Section renderers ---

function renderOverview(c: Metrics) {
  return `
    <section class="report-overview">
      <div class="report-eyebrow">Assessment Report</div>
      <h2>您的家庭财务健康总览</h2>
      <p>您的家庭总资产约为 <strong>${fmtWan(c.A)}</strong> 万元</p>
      <p>结论：您当前属于 <strong>${c.wealthLevel}</strong>。</p>
      <div class="metric-grid">
        ${metricCard("现金流与资产", c.section1Score)}
        ${metricCard("债务风险", c.section2Score)}
        ${metricCard("保障缺口", c.section3Score)}
        ${metricCard("投资与目标", c.section4Score)}
      </div>
      <div class="callout-grid">
        <article>
          <h3>关键指标</h3>
          <ul class="bullet-list compact">
            <li>应急资金覆盖：${c.Z !== null ? `${c.Z} 个月` : "—"}（标准：${c.standardMonths} 个月）</li>
            <li>总负债率：${c.L1 !== null ? `${fmtPct(c.L1)}%` : "—"}（健康线：50%）</li>
            <li>房产占比：${c.P4 !== null ? `${fmtPct(c.P4)}%` : "—"}（建议线：60%）</li>
          </ul>
        </article>
        <article>
          <h3>最需要关注的问题</h3>
          ${c.topConcerns.length ? `<ul class="bullet-list compact">${c.topConcerns.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p>目前未触发高优先级风险项。</p>`}
        </article>
      </div>
      <p class="priority-line"><strong>处理优先顺序：</strong>${priorityOrder}</p>
    </section>
  `;
}

function renderSection1(c: Metrics) {
  return `
    <section class="report-section">
      <h2>第一部分：现金流与资产结构评估</h2>
      <p><strong>综合打分：</strong>${c.section1Score}</p>
      <h3>1. 资产流动性结构</h3>
      ${table(["流动性等级", "资产类型", "金额（万元）", "占比"], [
        ["高流动性", "活钱", fmtWan(c.X1), pctOrDash(c.P1)],
        ["中高流动性", "投资的钱", fmtWan(c.X2), pctOrDash(c.P2)],
        ["中流动性", "养老 / 公积金", fmtWan(c.X3), pctOrDash(c.P3)],
        ["低流动性", "自住房产", fmtWan(c.X41), pctOrDash(c.P41)],
        ["低流动性", "投资房产", fmtWan(c.X42), pctOrDash(c.P42)],
        ["总资产", "-", fmtWan(c.A), "100%"],
      ])}
      ${paragraphs(liquidityParas(c))}
      <h3>2. 应急资金状况</h3>
      ${paragraphs(emergencyParas(c))}
      <h3>3. 月度现金流</h3>
      ${paragraphs(cashflowParas(c))}
      ${suggestionBlock(section1Suggestions(c))}
    </section>
  `;
}

function renderSection2(c: Metrics) {
  return `
    <section class="report-section">
      <h2>第二部分：债务风险评估</h2>
      <p><strong>综合打分：</strong>${c.section2Score}</p>
      <h3>1. 负债结构</h3>
      ${table(["负债类型", "余额（万元）", "占比"], [
        ["房贷", fmtWan(c.D1), pctOrDash(c.PD1)],
        ["其他负债", fmtWan(c.D2), pctOrDash(c.PD2)],
        ["总负债", fmtWan(c.D), "100%"],
      ])}
      ${c.D2 > 0 ? `<p>您的其他负债 ${fmtWan(c.D2)} 万元可能包含消费贷、网贷等高息债务，需立即核查年利率。</p>` : ""}
      <h3>2. 总负债率</h3>
      ${paragraphs(debtParas(c))}
      ${suggestionBlock(section2Suggestions(c))}
    </section>
  `;
}

function renderSection3(c: Metrics) {
  return `
    <section class="report-section">
      <h2>第三部分：保障缺口评估</h2>
      <p><strong>综合打分：</strong>${c.section3Score}</p>
      <h3>1. 家庭保障现状</h3>
      ${paragraphs(insuranceParas(c))}
      <h3>2. 保障缺口</h3>
      ${table(["风险类型", "风险敞口", "现有保障", "缺口评估"], insuranceGapRows(c))}
      ${suggestionBlock(section3Suggestions(c))}
    </section>
  `;
}

function renderSection4(c: Metrics) {
  return `
    <section class="report-section">
      <h2>第四部分：资产配置与目标评估</h2>
      <p><strong>综合打分：</strong>${c.section4Score}</p>
      <h3>1. 风险承受能力与风险偏好</h3>
      ${paragraphs(riskParas(c))}
      <h3>2. 财务目标与资金匹配</h3>
      ${paragraphs(goalParas(c))}
      <h3>3. 房产配置评估</h3>
      ${paragraphs(propertyParas(c))}
      ${c.X42 > 0 ? selfCheckList() : ""}
      ${suggestionBlock(section4Suggestions(c))}
    </section>
  `;
}

function renderSection5(c: Metrics, strategicReason: string, usedAi: boolean, model: string | null) {
  return `
    <section class="report-section">
      <h2>第五部分：2026年战略资产配置建议</h2>
      <p>根据您的财富等级（${c.wealthLevel}）和风险偏好（${labelMaps.riskPreference[c.input.riskPreference]}），建议的资产配置如下：</p>
      ${table(["资产类别", "建议配置比例"], [
        ["投资性房产", `${c.allocation.investmentProperty}%`],
        ["股票 / 基金", `${c.allocation.stocks}%`],
        ["债券 / 固收", `${c.allocation.bonds}%`],
        ["黄金 / 贵金属", `${c.allocation.gold}%`],
        ["现金 / 货币基金", `${c.allocation.cash}%`],
        ["保险 / 养老产品", `${c.allocation.insurance}%`],
        ["其他 / 另类", `${c.allocation.other}%`],
      ])}
      <div class="strategy-note">
        <div class="strategy-badges">
          <span class="pill">${usedAi ? "AI 已生成个性化配置说明" : "当前使用规则兜底说明"}</span>
          <span class="pill">${usedAi && model ? `模型：${model}` : "核心配置建议仍可直接使用"}</span>
        </div>
        ${strategicReason.split(/\n+/).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </div>
    </section>
  `;
}

function renderSection6(c: Metrics) {
  const items = knowledgeItems(c);
  if (!items.length) return "";
  return `
    <section class="report-section">
      <h2>第六部分：金融知识锦囊</h2>
      <ul class="bullet-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </section>
  `;
}

// --- Paragraph builders ---

function liquidityParas(c: Metrics) {
  const result: string[] = [];
  if (c.P1 !== null && c.P2 !== null) {
    const liquid = c.P1 + c.P2;
    result.push(liquid >= 40 ? `您的流动资产占比 ${fmtPct(liquid)}%，变现能力很强。` : `您的流动资产占比 ${fmtPct(liquid)}%，流动性基本合理。`);
  }
  if (c.condP4) result.push(`您的房产占比 ${fmtPct(c.P4)}%，遇到急事能马上调用的资金有限。`);
  return result;
}

function emergencyParas(c: Metrics) {
  if (c.EXP <= 0) return ["当前支出为 0，覆盖月数不适用。"];
  const result = [`您家应急资金（活钱）${fmtWan(c.X1)} 万元，按每月支出 ${fmtYuan(c.EXP)} 元计算，够用 ${c.Z} 个月。`];
  if (c.standardAmountWan !== null && c.gapAmountWan !== null) {
    result.push(`您家的标准应急金：根据您是 ${c.employmentType} 且收入 ${c.stabilityType}，建议储备 ${c.standardMonths} 个月，即 ${fmtWan(c.standardAmountWan)} 万元，当前缺口 ${fmtWan(c.gapAmountWan)} 万元。`);
    result.push(c.gapAmountWan <= 0 ? "您的应急金已达标，这是家庭财务安全的第一道防线。" : "应急金不足意味着一旦失业或生病，可能被迫低价卖资产或借高息贷款。");
  }
  return result;
}

function cashflowParas(c: Metrics) {
  if (c.INC <= 0) return ["无收入 / 现金流极不健康。"];
  const result = [`您家每月收入 ${fmtYuan(c.INC)} 元，支出 ${fmtYuan(c.EXP)} 元，能存下 ${fmtYuan(c.SAVE)} 元，储蓄率 ${fmtPct(c.savingsRate)}%。`];
  if ((c.savingsRate ?? 0) >= 20) result.push(`您的储蓄率 ${fmtPct(c.savingsRate)}%，现金流管理得很好。`);
  else if ((c.savingsRate ?? 0) >= 10) result.push(`您的储蓄率 ${fmtPct(c.savingsRate)}%，现金流基本健康。`);
  else if (c.SAVE > 0) result.push(`您的储蓄率仅 ${fmtPct(c.savingsRate)}%，现金流比较紧张。`);
  else result.push("您家目前入不敷出或零储蓄，财务状况非常脆弱。");
  result.push(`压力测试：假如收入减少 30%（月收入从 ${fmtYuan(c.INC)} 元降至 ${fmtYuan(c.stressedIncome)} 元），月结余会从 ${fmtYuan(c.SAVE)} 元变成 ${fmtYuan(c.stressedSave)} 元。`);
  if (c.stressedSave >= 0) result.push(`即使收入减少 30%，您家仍有月结余 ${fmtYuan(c.stressedSave)} 元，抗风险能力较强。`);
  else if (c.stressedMonths !== null && c.stressedMonths >= 0) result.push(`收入减少 30% 会出现每月缺口 ${fmtYuan(Math.abs(c.stressedSave))} 元，您的应急金 ${fmtWan(c.X1)} 万元可支撑约 ${c.stressedMonths} 个月。`);
  else result.push("您家目前已入不敷出，任何收入减少都会立即导致危机。");
  return result;
}

function debtParas(c: Metrics) {
  if (c.L1 === null) return ["总资产为 0，暂不适用负债率评估。"];
  const result = [
    `您家总负债率为 ${fmtPct(c.L1)}%（总负债 ${fmtWan(c.D)} 万元 ÷ 总资产 ${fmtWan(c.A)} 万元）。`,
    "健康标准：优秀 <30%、健康 30-50%、警戒 50-70%、危险 >70%。",
  ];
  if (c.L1 < 30) result.push(`您的负债率仅 ${fmtPct(c.L1)}%，财务压力很小。`);
  else if (c.L1 < 50) result.push(`您的负债率 ${fmtPct(c.L1)}% 在健康范围，需控制不再增加。`);
  else if (c.L1 < 70) result.push("您的负债率接近或超过健康线，财务弹性较弱。");
  else result.push("您的负债率严重超标，抗风险能力非常弱。");
  return result;
}

function insuranceParas(c: Metrics) {
  const status = c.input.insuranceStatus;
  const result = [`您家的保障水平为：${labelMaps.insuranceStatus[status]}`];
  if (status === "A") result.push("您家保障配置比较全面。");
  else if (status === "B") result.push("您有一些保障意识，但需核查险种是否齐全、保额是否充足。");
  else result.push("您家基本处于\u201C裸奔\u201D状态，一旦主要赚钱的人出事，家庭将面临巨额医疗支出、收入中断和债务无人承担三重打击。");
  return result;
}

function insuranceGapRows(c: Metrics) {
  const status = c.input.insuranceStatus;
  const current = status === "A" ? "全面" : status === "B" ? "部分" : status === "C" ? "仅医保" : "未知";
  const gap = status === "A" ? "已覆盖" : status === "B" ? "部分覆盖" : "完全敞口";
  return [
    ["重疾治疗费", "30-50万", current, gap],
    ["大额医疗费", "100-300万", current, gap],
    ["身故 / 伤残损失", c.termLifeCoverageWan !== null ? `${fmtWan(c.termLifeCoverageWan)} 万` : "—", current, gap],
  ];
}

function riskParas(c: Metrics) {
  const subjective = labelMaps.riskPreference[c.input.riskPreference];
  const result = [
    `您的实际风险承受能力为：${c.actualRiskCapacity}（根据收入、家庭结构、负债、保障综合评估）`,
    `您的主观风险偏好是：${subjective}`,
    `两者${c.riskMatch ? "匹配" : "不匹配"}。`,
  ];
  if (c.riskMatch) result.push("您的风险偏好与实际承受能力匹配。");
  else if (c.subjectiveRiskScore > c.actualRiskScore) result.push("您的风险偏好比实际承受能力更激进，市场波动时可能因财务压力被迫低位割肉。");
  else result.push("您的风险偏好比实际承受能力更保守，资产增值潜力可能被浪费。");
  result.push("建议：资产配置以\u201C实际承受能力\u201D为准，不凭感觉投资。");
  return result;
}

function goalParas(c: Metrics) {
  const result = [`您的主要目标包括：${c.goalsText}`];
  if (c.rigidGoals && c.highRiskPreference) {
    result.push("您的目标包含教育金或养老金（时间和金额固定），但风险偏好进取 / 激进，这意味着您可能用高波动资产准备这笔钱。风险是当目标需要实现时刚好遇到市场低点，资产缩水无法达成目标。");
  } else if (!c.rigidGoals && c.highRiskPreference && c.input.goals.some((g) => g === "C" || g === "E")) {
    result.push("您的目标主要是弹性目标，可以接受波动，您的进取型风格匹配。");
  } else if (c.rigidGoals && (c.input.riskPreference === "A" || c.input.riskPreference === "B")) {
    result.push("您的目标包含刚性目标，风格保守 / 稳健，配置合理。");
  } else {
    result.push("您的目标较为综合，建议把不同目标分账户管理，避免同一笔资金承担过多任务。");
  }
  return result;
}

function propertyParas(c: Metrics) {
  const result = [
    `您家房产占比 ${c.P4 !== null ? `${fmtPct(c.P4)}%` : "—"}（自住房 ${fmtWan(c.X41)} 万元 + 投资房 ${fmtWan(c.X42)} 万元）。`,
    "健康标准：建议不超过 60%。",
  ];
  if (c.P4 !== null) {
    if (c.P4 < 50) result.push(`您的房产占比 ${fmtPct(c.P4)}%，资产流动性很好。`);
    else if (c.P4 <= 60) result.push(`您的房产占比 ${fmtPct(c.P4)}%，处于合理区间上限。`);
    else result.push("您的房产占比已超过建议线，资产流动性较弱。");
  }
  return result;
}

// --- Suggestion builders ---

function section1Suggestions(c: Metrics) {
  const items: string[] = [];
  const needsEmergencyFund = c.Z !== null && c.Z < c.standardMonths;
  if (needsEmergencyFund && c.standardAmountWan !== null && c.gapAmountWan !== null) {
    let detail = `应急金需达到 ${c.standardMonths} 个月支出（${fmtWan(c.standardAmountWan)} 万元），当前缺口 ${fmtWan(c.gapAmountWan)} 万元。优先从【投资的钱】中调配低波动资金（货币基金、短债基金），不动用教育金/养老金专用资金。`;
    if (c.SAVE > 0) detail += ` 通过每月储蓄持续积累，预计需 ${Math.ceil((c.gapAmountWan * 10000) / c.SAVE)} 个月。`;
    if (c.SAVE < 1000) detail += " 先建立 3 个月极简应急金。";
    items.push(`<p><strong>建议 1：</strong>补足应急资金</p><p>${detail}</p>`);
  }
  if (c.SAVE <= 0) {
    items.push(`<p><strong>建议 ${items.length + 1}：</strong>现金流止血</p><p>第一步让月结余回到正数，连续 3 个月记账，削减非刚性开支至少 ${fmtYuan(Math.abs(c.SAVE))} 元/月，延后非刚性目标（换房 / 旅游 / 换车）；第二步把储蓄率提升到 ≥10%（每月能存 ≥ ${fmtYuan(c.INC * 0.1)} 元）。先攒 1-3 个月极简应急金。</p>`);
  }
  return items;
}

function section2Suggestions(c: Metrics) {
  const items: string[] = [];
  if (c.D2 > 0) {
    items.push(`<p><strong>建议 1：</strong>核查并优先偿还高息债务</p><p>打开银行 App 或贷款 App，逐笔核查年利率，识别消费贷、网贷等年利率 &gt;10% 的高息部分。从【投资的钱】中赎回年化收益低于债务利率的部分提前还款，或每月从储蓄中拿出 30%-50% 额外还款，还款顺序按利率从高到低。1 周内核查完成，3-6 个月内清偿高息部分。</p>`);
  }
  if (c.L1 !== null && c.L1 > 50) {
    items.push(`<p><strong>建议 ${items.length + 1}：</strong>暂停新增非必要负债</p><p>暂停大额消费贷、非刚需车贷、装修贷、信用卡分期。在应急金达标且无高息债务后，可用每月储蓄的 30%-50% 提前还低息贷款（如房贷）。</p>`);
  }
  return items;
}

function section3Suggestions(c: Metrics) {
  if (c.input.insuranceStatus === "A") return [];
  let budget = "保费预算每月 500-750 元（占月储蓄 10%-15%）。";
  if (c.SAVE >= 2000 && c.SAVE < 5000) budget = "保费预算每月 300-500 元。";
  else if (c.SAVE < 2000) budget = "保费预算每月 200 元以内，优先百万医疗 + 意外险。";
  return [`<p><strong>建议 1：</strong>按优先级配置核心保障</p><p>为家庭主要赚钱的人配齐核心保障（百万医疗、定期寿险、意外险）。${budget}</p><p>先保家庭主要赚钱的人，其次配偶，孩子最后。预算紧张先配百万医疗 + 意外险。3 个月内完成核心配置。</p>`];
}

function section4Suggestions(c: Metrics) {
  const items: string[] = [];
  if (c.rigidGoals && c.highRiskPreference) {
    items.push(`<p><strong>建议 1：</strong>调整刚性目标资金配置</p><p>将【投资的钱】中用于教育金 / 养老金的部分从股票、偏股基金转入银行理财、债券基金（年化 3.5-4%）。单独开设专户，资金划入后不挪用。如当前浮亏超过 10%，分 3-6 个月分批赎回，避免低位割肉。</p>`);
  }
  if (c.condP4) {
    items.push(`<p><strong>建议 ${items.length + 1}：</strong>投资房产优化</p><p>根据上面"投资房自查清单"评估，如满足 2 项及以上问题，考虑出售。售房资金分配顺序：应急金 → 高息债务 → 刚性目标 → 保险储备 → 稳健投资。6-12 个月内完成评估和决策。</p>`);
  }
  if (c.subjectiveRiskScore > c.actualRiskScore) {
    items.push(`<p><strong>建议 ${items.length + 1}：</strong>降低投资风险等级</p><p>将【投资的钱】中股票和偏股基金的 30%-50%，分 6 个月转为债券基金或银行理财。如当前浮亏，分批操作避免低位割肉。</p>`);
  }
  if (c.multiGoalPressure) {
    items.push(`<p><strong>建议 ${items.length + 1}：</strong>应对多目标压力</p><p>节流优先、延后目标、不加风险。三个优先级：通过 3 个月记账提高储蓄率 → 处置低效资产（参考投资房自查） → 延后非刚性目标（换房延后 2-3 年，旅游延后 1 年），集中资源实现刚性目标。</p>`);
  }
  return items;
}

function knowledgeItems(c: Metrics) {
  const items: string[] = [];
  if (c.condZ) items.push("了解应急金：理解为什么需要预留 3-6 个月的生活费作为家庭的第一道防线。");
  if (c.condP4) items.push("了解资产流动性：理解为什么\u201C房产\u201D不等于\u201C现金\u201D，以及\u201C纸面富贵\u201D的潜在风险。");
  if (c.condSecureKnowledge) items.push("了解保险杠杆：理解保险是如何用较小的保费来转移（如医疗、身故）的巨大财务风险。");
  if (c.condRiskA) items.push("了解通货膨胀：理解为什么长期只持有现金或存款，您的购买力可能会下降。");
  if (c.condDebt) items.push("了解高息债务：理解为什么年化收益跑不赢负债利率时，应优先处理高成本负债。");
  return items;
}

// --- Render helpers ---

function metricCard(label: string, value: string) {
  return `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`;
}

function paragraphs(items: string[]) {
  return items.map((p) => `<p>${p}</p>`).join("");
}

function table(headers: string[], rows: string[][]) {
  return `
    <div class="table-wrap">
      <table class="report-table">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function suggestionBlock(items: string[]) {
  if (!items.length) return '<p class="empty-suggestion">您在这一部分表现非常出色，暂无调整建议。</p>';
  return `<div class="suggestion-stack">${items.join("")}</div>`;
}

function selfCheckList() {
  return `
    <div class="self-check">
      <h3>投资房自查（满足 2 项及以上建议考虑处置）</h3>
      <ul class="bullet-list">
        <li>长期空置超过 6 个月？</li>
        <li>租金年回报率低于 3%？（年租金 ÷ 房价）</li>
        <li>所在城市房价横盘或下行超过 1 年？</li>
        <li>占用了其他重要目标资金？</li>
        <li>持有成本（房贷利息、物业费、税费）超过年租金 50%？</li>
      </ul>
    </div>
  `;
}
