import { z } from "zod";

const choice = z.enum(["A", "B", "C", "D", "E", "F", "G"]);
const numeric = z.number().finite().min(0);

export const assessmentSchema = z.object({
  x1: numeric,
  x2: numeric,
  x3: numeric,
  x41: numeric,
  x42: numeric,
  d1: numeric,
  d2: numeric,
  incomeWan: numeric,
  saveWan: z.number().finite(),
  incomeStability: z.enum(["A", "B", "C", "D"]),
  familyStructure: z.enum(["A", "B", "C", "D"]),
  parentSupport: z.enum(["A", "B", "C", "D"]),
  childrenStages: z.array(z.enum(["A", "B", "C", "D", "E", "F"])).default([]),
  insuranceStatus: z.enum(["A", "B", "C", "D"]),
  ageRange: z.enum(["A", "B", "C", "D", "E"]),
  cityTier: z.enum(["A", "B", "C"]),
  goals: z.array(choice).default([]),
  riskPreference: z.enum(["A", "B", "C", "D", "E"]),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
