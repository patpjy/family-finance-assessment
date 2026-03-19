export type Option = {
  value: string;
  label: string;
};

export type NumberFieldConfig = {
  type: "number";
  name: string;
  label: string;
  hint?: string;
  min?: number;
  step?: number;
};

export type SingleFieldConfig = {
  type: "single";
  name: string;
  label: string;
  options: Option[];
};

export type MultiFieldConfig = {
  type: "multi";
  name: string;
  label: string;
  options: Option[];
};

export type FieldConfig = NumberFieldConfig | SingleFieldConfig | MultiFieldConfig;

export type StepConfig = {
  key: string;
  title: string;
  subtitle: string;
  fields: FieldConfig[];
};

export type AssessmentApiResponse = {
  meta: {
    generatedAt: string;
    wealthLevel: string;
    totalAssets: number;
    usedAi: boolean;
    model: string | null;
  };
  reportHtml: string;
  reportText: string;
};
