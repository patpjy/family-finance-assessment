import { computeMetrics } from "@/lib/assessment/metrics";
import { getStrategicReason } from "@/lib/assessment/ai";
import { renderReportHtml } from "@/lib/assessment/report";
import { htmlToText } from "@/lib/assessment/format";
import type { AssessmentInput } from "@/lib/assessment/schema";
import type { AssessmentApiResponse } from "@/lib/assessment/types";

export async function buildAssessmentReport(input: AssessmentInput): Promise<AssessmentApiResponse> {
  const computed = computeMetrics(input);
  const strategic = await getStrategicReason(computed);
  const reportHtml = renderReportHtml(computed, strategic.text, strategic.usedAi, strategic.model);
  const reportText = htmlToText(reportHtml);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      wealthLevel: computed.wealthLevel,
      totalAssets: computed.A,
      usedAi: strategic.usedAi,
      model: strategic.model,
    },
    reportHtml,
    reportText,
  };
}
