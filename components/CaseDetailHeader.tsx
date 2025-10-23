import CaseStatusBadge from "./CaseStatusBadge";
import type { CaseRecord } from "../types/case";

export default function CaseDetailHeader({ caseData }: { caseData: CaseRecord }) {
  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            {caseData.productName ?? "Case"}
          </h2>
          <p className="text-sm text-slate-500">
            Store: {caseData.storeName ?? "—"} · Created{" "}
            {new Date(caseData.createdAt).toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">
            User: {caseData.userName ?? "—"} ({caseData.userEmail ?? "unknown"})
          </p>
        </div>
        <CaseStatusBadge status={caseData.status} />
      </div>
    </div>
  );
}
