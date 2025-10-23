import type { CaseRecord } from "../types/case";

export function buildPrompt(caseData: CaseRecord) {
  const lines = [
    `Case ID: ${caseData._id}`,
    caseData.storeName ? `Store: ${caseData.storeName}` : null,
    caseData.productName ? `Product: ${caseData.productName}` : null,
    caseData.userEmail ? `User Email: ${caseData.userEmail}` : null,
    caseData.manualAnalysis?.text
      ? `Manual Analysis: ${caseData.manualAnalysis.text}`
      : null,
    caseData.resolution?.code ? `Resolution Code: ${caseData.resolution.code}` : null,
    `Status: ${caseData.status}`,
    `Emails Count: ${caseData.emails.length}`
  ]
    .filter(Boolean)
    .join("\n");

  return `${lines}\n\nNext steps:\n- Summarize key issue\n- Decide on shop outreach tone\n- Highlight missing data if any`;
}
