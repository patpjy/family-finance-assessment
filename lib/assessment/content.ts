import type { StepConfig } from "@/lib/assessment/types";

export const labelMaps = {
  incomeStability: {
    A: "非常稳定",
    B: "稳定",
    C: "波动较大",
    D: "很不稳定",
  },
  familyStructure: {
    A: "单身 / 未婚",
    B: "已婚，双方都在工作",
    C: "已婚，只有一人在工作",
    D: "其他",
  },
  parentSupport: {
    A: "不需要",
    B: "偶尔补贴",
    C: "经常补贴",
    D: "主要由我负担",
  },
  insuranceStatus: {
    A: "保障全面",
    B: "有一些，但不确定",
    C: "基本没有商业保险",
    D: "不太了解",
  },
  ageRange: {
    A: "30 岁以下",
    B: "31-40 岁",
    C: "41-50 岁",
    D: "51-60 岁",
    E: "60 岁以上",
  },
  cityTier: {
    A: "一线城市",
    B: "新一线 / 二线",
    C: "三线及以下",
  },
  goals: {
    A: "准备子女教育金",
    B: "准备自己的养老金",
    C: "购买或置换房产",
    D: "储备一笔备用金以应对不时之需",
    E: "追求资产的快速增值",
    F: "提前退休",
    G: "其他",
  },
  riskPreference: {
    A: "保守型",
    B: "稳健型",
    C: "平衡型",
    D: "进取型",
    E: "激进型",
  },
  childrenStages: {
    A: "暂无子女",
    B: "学龄前",
    C: "小学",
    D: "初高中",
    E: "大学 / 留学",
    F: "已工作独立",
  },
} as const;

export const steps: StepConfig[] = [
  {
    key: "assets",
    title: "Step A",
    subtitle: "资产盘点",
    fields: [
      { type: "number", name: "x1", label: "1. 活钱（万元）", hint: "现金、微信零钱、支付宝余额、余额宝等", min: 0, step: 0.1 },
      { type: "number", name: "x2", label: "2. 投资的钱（万元）", hint: "股票、基金、理财、黄金等，不含活钱", min: 0, step: 0.1 },
      { type: "number", name: "x3", label: "3. 养老 / 公积金（万元）", hint: "公积金余额、养老金账户等", min: 0, step: 0.1 },
      { type: "number", name: "x41", label: "4. 自住房产（万元）", hint: "按当前大致可出售价格估算", min: 0, step: 0.1 },
      { type: "number", name: "x42", label: "5. 投资房产（万元）", hint: "出租房、商铺、空置房等", min: 0, step: 0.1 },
    ],
  },
  {
    key: "debt",
    title: "Step B",
    subtitle: "负债与现金流",
    fields: [
      { type: "number", name: "d1", label: "6. 房贷剩余（万元）", hint: "银行 App 中可查剩余本金", min: 0, step: 0.1 },
      { type: "number", name: "d2", label: "7. 其他负债（万元）", hint: "车贷、消费贷、信用贷、经营贷、网贷等", min: 0, step: 0.1 },
      { type: "number", name: "incomeWan", label: "8. 家庭月收入（万元）", hint: "家庭每月到手收入总额", min: 0, step: 0.1 },
      { type: "number", name: "saveWan", label: "9. 家庭月结余（万元）", hint: "扣除所有支出和还贷后，每月能存下来的钱；允许填写负数", step: 0.1 },
    ],
  },
  {
    key: "risk",
    title: "Step C",
    subtitle: "家庭与风险",
    fields: [
      {
        type: "single",
        name: "incomeStability",
        label: "10. 收入稳定性",
        options: [
          { value: "A", label: "A. 非常稳定" },
          { value: "B", label: "B. 稳定" },
          { value: "C", label: "C. 波动较大" },
          { value: "D", label: "D. 很不稳定" },
        ],
      },
      {
        type: "single",
        name: "familyStructure",
        label: "11. 家庭收入结构",
        options: [
          { value: "A", label: "A. 单身 / 未婚" },
          { value: "B", label: "B. 已婚，双方都在工作" },
          { value: "C", label: "C. 已婚，只有一人在工作" },
          { value: "D", label: "D. 其他" },
        ],
      },
      {
        type: "single",
        name: "parentSupport",
        label: "12. 父母赡养",
        options: [
          { value: "A", label: "A. 不需要" },
          { value: "B", label: "B. 偶尔补贴" },
          { value: "C", label: "C. 经常补贴" },
          { value: "D", label: "D. 主要由我负担" },
        ],
      },
      {
        type: "multi",
        name: "childrenStages",
        label: "13. 子女情况（可多选）",
        options: [
          { value: "A", label: "A. 暂无子女" },
          { value: "B", label: "B. 学龄前" },
          { value: "C", label: "C. 小学" },
          { value: "D", label: "D. 初高中" },
          { value: "E", label: "E. 大学 / 留学" },
          { value: "F", label: "F. 已工作独立" },
        ],
      },
      {
        type: "single",
        name: "insuranceStatus",
        label: "14. 家庭保障",
        options: [
          { value: "A", label: "A. 保障全面" },
          { value: "B", label: "B. 有一些，但不确定" },
          { value: "C", label: "C. 基本没有商业保险" },
          { value: "D", label: "D. 不太了解" },
        ],
      },
      {
        type: "single",
        name: "ageRange",
        label: "15. 年龄段",
        options: [
          { value: "A", label: "A. 30 岁以下" },
          { value: "B", label: "B. 31-40 岁" },
          { value: "C", label: "C. 41-50 岁" },
          { value: "D", label: "D. 51-60 岁" },
          { value: "E", label: "E. 60 岁以上" },
        ],
      },
      {
        type: "single",
        name: "cityTier",
        label: "16. 主要房产城市级别",
        options: [
          { value: "A", label: "A. 一线城市" },
          { value: "B", label: "B. 新一线 / 二线" },
          { value: "C", label: "C. 三线及以下" },
        ],
      },
      {
        type: "multi",
        name: "goals",
        label: "17. 主要目标（至少选 1 项）",
        options: [
          { value: "A", label: "A. 子女教育金" },
          { value: "B", label: "B. 自己的养老金" },
          { value: "C", label: "C. 购买或置换房产" },
          { value: "D", label: "D. 储备备用金" },
          { value: "E", label: "E. 追求快速增值" },
          { value: "F", label: "F. 提前退休" },
          { value: "G", label: "G. 其他" },
        ],
      },
      {
        type: "single",
        name: "riskPreference",
        label: "18. 风险偏好",
        options: [
          { value: "A", label: "A. 保守型" },
          { value: "B", label: "B. 稳健型" },
          { value: "C", label: "C. 平衡型" },
          { value: "D", label: "D. 进取型" },
          { value: "E", label: "E. 激进型" },
        ],
      },
    ],
  },
];

export const allocationTables = {
  起步家庭: {
    A: { investmentProperty: 0, stocks: 0, bonds: 40, gold: 5, cash: 15, insurance: 40, other: 0 },
    B: { investmentProperty: 0, stocks: 10, bonds: 50, gold: 10, cash: 10, insurance: 20, other: 0 },
    C: { investmentProperty: 0, stocks: 30, bonds: 40, gold: 10, cash: 5, insurance: 15, other: 0 },
    D: { investmentProperty: 0, stocks: 55, bonds: 25, gold: 10, cash: 5, insurance: 5, other: 0 },
    E: { investmentProperty: 0, stocks: 70, bonds: 10, gold: 15, cash: 5, insurance: 0, other: 0 },
  },
  中产家庭: {
    A: { investmentProperty: 0, stocks: 5, bonds: 50, gold: 10, cash: 10, insurance: 25, other: 0 },
    B: { investmentProperty: 0, stocks: 15, bonds: 45, gold: 10, cash: 5, insurance: 25, other: 0 },
    C: { investmentProperty: 0, stocks: 35, bonds: 35, gold: 10, cash: 5, insurance: 15, other: 0 },
    D: { investmentProperty: 0, stocks: 60, bonds: 20, gold: 10, cash: 5, insurance: 5, other: 0 },
    E: { investmentProperty: 0, stocks: 75, bonds: 5, gold: 15, cash: 5, insurance: 0, other: 0 },
  },
  富裕家庭: {
    A: { investmentProperty: 0, stocks: 5, bonds: 55, gold: 10, cash: 5, insurance: 25, other: 0 },
    B: { investmentProperty: 0, stocks: 20, bonds: 45, gold: 10, cash: 5, insurance: 20, other: 0 },
    C: { investmentProperty: 0, stocks: 40, bonds: 30, gold: 10, cash: 5, insurance: 15, other: 0 },
    D: { investmentProperty: 0, stocks: 60, bonds: 15, gold: 15, cash: 5, insurance: 5, other: 0 },
    E: { investmentProperty: 0, stocks: 75, bonds: 5, gold: 15, cash: 5, insurance: 0, other: 0 },
  },
  高净值家庭: {
    A: { investmentProperty: 5, stocks: 5, bonds: 55, gold: 10, cash: 5, insurance: 15, other: 5 },
    B: { investmentProperty: 5, stocks: 20, bonds: 40, gold: 10, cash: 5, insurance: 10, other: 10 },
    C: { investmentProperty: 5, stocks: 40, bonds: 25, gold: 10, cash: 5, insurance: 5, other: 15 },
    D: { investmentProperty: 5, stocks: 55, bonds: 10, gold: 10, cash: 5, insurance: 0, other: 15 },
    E: { investmentProperty: 0, stocks: 65, bonds: 5, gold: 10, cash: 5, insurance: 0, other: 15 },
  },
  超高净值家庭: {
    A: { investmentProperty: 10, stocks: 5, bonds: 50, gold: 15, cash: 5, insurance: 10, other: 5 },
    B: { investmentProperty: 10, stocks: 20, bonds: 35, gold: 15, cash: 5, insurance: 5, other: 10 },
    C: { investmentProperty: 10, stocks: 35, bonds: 20, gold: 15, cash: 5, insurance: 0, other: 15 },
    D: { investmentProperty: 5, stocks: 45, bonds: 10, gold: 15, cash: 5, insurance: 0, other: 20 },
    E: { investmentProperty: 5, stocks: 55, bonds: 5, gold: 15, cash: 5, insurance: 0, other: 20 },
  },
} as const;
