import { labelMaps, allocationTables } from "@/lib/assessment/content";
import type { AssessmentInput } from "@/lib/assessment/schema";

type AllocationRow = {
  investmentProperty: number;
  stocks: number;
  bonds: number;
  gold: number;
  cash: number;
  insurance: number;
  other: number;
};

type ScoreLabel = "优" | "良" | "一般" | "差";

export type Metrics = ReturnType<typeof computeMetrics>;

export function computeMetrics(input: AssessmentInput) {
  const X1 = input.x1;
  const X2 = input.x2;
  const X3 = input.x3;
  const X41 = input.x41;
  const X42 = input.x42;
  const D1 = input.d1;
  const D2 = input.d2;
  const INC = input.incomeWan * 10000;
  const SAVE = input.saveWan * 10000;
  const EXP = INC - SAVE;
  const A = X1 + X2 + X3 + X41 + X42;
  const D = D1 + D2;

  const P1 = A > 0 ? (X1 / A) * 100 : null;
  const P2 = A > 0 ? (X2 / A) * 100 : null;
  const P3 = A > 0 ? (X3 / A) * 100 : null;
  const P41 = A > 0 ? (X41 / A) * 100 : null;
  const P42 = A > 0 ? (X42 / A) * 100 : null;
  const P4 = A > 0 ? ((X41 + X42) / A) * 100 : null;
  const PD1 = D > 0 ? (D1 / D) * 100 : null;
  const PD2 = D > 0 ? (D2 / D) * 100 : null;
  const L1 = A > 0 ? (D / A) * 100 : null;
  const Z = EXP > 0 ? Math.floor((X1 * 10000) / EXP) : null;
  const standardMonths = getStandardMonths(input.familyStructure, input.incomeStability);
  const standardAmountWan = EXP > 0 ? (standardMonths * EXP) / 10000 : null;
  const gapAmountWan = standardAmountWan !== null ? Math.max(standardAmountWan - X1, 0) : null;
  const savingsRate = INC > 0 ? (SAVE / INC) * 100 : null;
  const stressedIncome = INC * 0.7;
  const stressedSave = SAVE - INC * 0.3;
  const stressedMonths = stressedSave < 0 && SAVE > 0 ? Math.floor((X1 * 10000) / (INC * 0.3 - SAVE)) : null;
  const annualLivingExpenseWan = EXP > 0 ? (EXP * 12) / 10000 : null;
  const employmentType = input.familyStructure === "B" ? "双职工" : "单职工";
  const stabilityType = input.incomeStability === "A" || input.incomeStability === "B" ? "稳定" : "波动";
  const termYears = employmentType === "双职工" ? 5 : 10;
  const termLifeCoverageWan = annualLivingExpenseWan !== null ? D1 + annualLivingExpenseWan * termYears : null;
  const wealthLevel = getWealthLevel(A);
  const allocationTableKey = wealthLevel === "新起步家庭" ? "起步家庭" : wealthLevel;
  const allocation = allocationTables[allocationTableKey as keyof typeof allocationTables][input.riskPreference as keyof (typeof allocationTables)["起步家庭"]] as AllocationRow;
  const actualRiskCapacity = getActualRiskCapacity({ input, L1, savingsRate });
  const subjectiveRiskScore = getSubjectiveRiskScore(input.riskPreference);
  const actualRiskScore = { 稳健型: 1, 平衡型: 2, 进取型: 3 }[actualRiskCapacity];
  const riskMatch = subjectiveRiskScore === actualRiskScore;
  const goalsText = input.goals.length ? input.goals.map((goal) => labelMaps.goals[goal]).join("、") : "其他";
  const childrenText = input.childrenStages.length ? input.childrenStages.map((stage) => labelMaps.childrenStages[stage]).join("、") : "暂无子女";
  const rigidGoals = input.goals.some((goal) => goal === "A" || goal === "B");
  const highRiskPreference = input.riskPreference === "D" || input.riskPreference === "E";
  const multiGoalPressure = input.goals.length >= 3 || (input.goals.length >= 2 && (savingsRate ?? 0) < 20);
  const condDebt = D > 0 && D2 >= 10 && D2 / D >= 0.2;
  const condSecureTopConcern = input.insuranceStatus === "B" || input.insuranceStatus === "C" || input.insuranceStatus === "D";
  const condSecureKnowledge = input.insuranceStatus === "C" || input.insuranceStatus === "D";
  const condRiskA = input.riskPreference === "A";
  const condP4 = P4 !== null && P4 > 60;
  const condZ = Z !== null && Z < 3;

  const section1Score = scoreSection1({ savingsRate, SAVE, Z, standardMonths, P4, liquidPct: P1 !== null && P2 !== null ? P1 + P2 : null });
  const section2Score = scoreSection2({ L1, D2 });
  const section3Score = scoreSection3(input.insuranceStatus);
  const section4Score = scoreSection4({ riskMatch, subjectiveRiskScore, actualRiskScore, P4, rigidGoals, highRiskPreference, multiGoalPressure });

  const topConcerns = [
    SAVE <= 0 ? `您家目前入不敷出，任何意外都可能导致财务危机。` : null,
    condDebt ? `您有其他负债 ${D2.toFixed(1)} 万元，需立即核查是否包含年利率>10%的高息债务。` : null,
    condZ ? `您的应急资金仅能支撑 ${Z} 个月，抗风险能力很弱。` : null,
    condSecureTopConcern ? `您家缺少核心保障，一旦主要赚钱的人出事，家庭财务会立即崩溃。` : null,
    condP4 ? `您的房产占比 ${(P4 ?? 0).toFixed(1)}%，变现能力弱。` : null,
  ].filter(Boolean).slice(0, 3) as string[];

  return {
    input, X1, X2, X3, X41, X42, D1, D2, INC, SAVE, EXP, A, D,
    P1, P2, P3, P41, P42, P4, PD1, PD2, L1, Z,
    standardMonths, standardAmountWan, gapAmountWan, savingsRate,
    stressedIncome, stressedSave, stressedMonths, annualLivingExpenseWan,
    termYears, termLifeCoverageWan, employmentType, stabilityType,
    wealthLevel, allocation, actualRiskCapacity, actualRiskScore, subjectiveRiskScore,
    riskMatch, goalsText, childrenText, rigidGoals, highRiskPreference, multiGoalPressure,
    condDebt, condSecureTopConcern, condSecureKnowledge, condRiskA, condP4, condZ,
    topConcerns, section1Score, section2Score, section3Score, section4Score,
  };
}

// --- Scoring ---

function scoreSection1({ savingsRate, SAVE, Z, standardMonths, P4, liquidPct }: { savingsRate: number | null; SAVE: number; Z: number | null; standardMonths: number; P4: number | null; liquidPct: number | null }): ScoreLabel {
  let score = 4;
  if (SAVE <= 0) score -= 2;
  else if ((savingsRate ?? 0) < 10) score -= 1;
  if (Z !== null) {
    if (Z < 3) score -= 1.5;
    else if (Z < standardMonths) score -= 0.5;
  }
  if (P4 !== null && P4 > 60) score -= 1;
  if (liquidPct !== null && liquidPct < 15) score -= 0.5;
  return toLabel(score);
}

function scoreSection2({ L1, D2 }: { L1: number | null; D2: number }): ScoreLabel {
  let score = 4;
  if (D2 > 0) score -= 0.5;
  if (L1 !== null) {
    if (L1 >= 70) score -= 2.5;
    else if (L1 >= 50) score -= 1.5;
    else if (L1 >= 30) score -= 0.5;
  }
  return toLabel(score);
}

function scoreSection3(status: AssessmentInput["insuranceStatus"]): ScoreLabel {
  if (status === "A") return "优";
  if (status === "B") return "良";
  return "差";
}

function scoreSection4({ riskMatch, subjectiveRiskScore, actualRiskScore, P4, rigidGoals, highRiskPreference, multiGoalPressure }: { riskMatch: boolean; subjectiveRiskScore: number; actualRiskScore: number; P4: number | null; rigidGoals: boolean; highRiskPreference: boolean; multiGoalPressure: boolean }): ScoreLabel {
  let score = 4;
  if (!riskMatch) score -= 1.5;
  if (subjectiveRiskScore > actualRiskScore) score -= 0.5;
  if (P4 !== null && P4 > 60) score -= 1;
  if (rigidGoals && highRiskPreference) score -= 0.5;
  if (multiGoalPressure) score -= 0.5;
  return toLabel(score);
}

function toLabel(score: number): ScoreLabel {
  if (score >= 3) return "优";
  if (score >= 2) return "良";
  if (score >= 1) return "一般";
  return "差";
}

// --- Helpers ---

function getStandardMonths(familyStructure: AssessmentInput["familyStructure"], incomeStability: AssessmentInput["incomeStability"]) {
  const isStable = incomeStability === "A" || incomeStability === "B";
  const isDouble = familyStructure === "B";
  if (isDouble && isStable) return 6;
  if (isDouble && !isStable) return 9;
  if (!isDouble && isStable) return 9;
  return 12;
}

function getWealthLevel(totalAssets: number) {
  if (totalAssets < 50) return "新起步家庭";
  if (totalAssets < 200) return "起步家庭";
  if (totalAssets < 600) return "中产家庭";
  if (totalAssets < 1000) return "富裕家庭";
  if (totalAssets < 10000) return "高净值家庭";
  return "超高净值家庭";
}

function getActualRiskCapacity({ input, L1, savingsRate }: { input: AssessmentInput; L1: number | null; savingsRate: number | null }) {
  let score = 1;
  if (input.familyStructure === "B") score += 1;
  if ((savingsRate ?? 0) >= 20) score += 1;
  if (L1 !== null && L1 > 50) score -= 1;
  if (input.insuranceStatus === "C" || input.insuranceStatus === "D") score -= 1;
  if (input.parentSupport === "C" || input.parentSupport === "D") score -= 1;
  if (input.childrenStages.some((stage) => stage === "B" || stage === "C" || stage === "D" || stage === "E")) score -= 1;
  if (input.incomeStability === "C" || input.incomeStability === "D") score -= 1;
  const clamped = Math.max(1, Math.min(3, score));
  return ["稳健型", "平衡型", "进取型"][clamped - 1] as "稳健型" | "平衡型" | "进取型";
}

function getSubjectiveRiskScore(riskPreference: AssessmentInput["riskPreference"]) {
  return { A: 0, B: 1, C: 2, D: 3, E: 4 }[riskPreference];
}
