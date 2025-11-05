import CaseStatusBadge from "./CaseStatusBadge";
import type { CaseRecord } from "../types/case";

export default function CaseDetailHeader({ caseData }: { caseData: CaseRecord }) {
  const title = caseData.productName ?? caseData.product ?? caseData.description ?? "Case";
  const storeLabel = caseData.storeName ?? caseData.store ?? "—";
  
  const formatExpiryDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isExpired = date < now;
    return { date, isExpired };
  };
  
  const expiryInfo = caseData.resolution?.expiryDate ? formatExpiryDate(caseData.resolution.expiryDate) : null;
  
  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            {title}
          </h2>
          <p className="text-sm text-slate-500">
            Store: {storeLabel} · Created{" "}
            {new Date(caseData.createdAt).toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">
            User: {caseData.userName ?? "—"} ({caseData.userEmail ?? "unknown"})
          </p>
          {caseData.resolution?.code && (
            <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
              <p className="text-sm font-semibold text-emerald-800">
                Voucher Code: <span className="font-mono">{caseData.resolution.code}</span>
              </p>
              {expiryInfo && (
                <p className={`text-xs mt-1 ${expiryInfo.isExpired ? 'text-red-600 font-semibold' : 'text-emerald-700'}`}>
                  {expiryInfo.isExpired ? '⚠️ Expired: ' : 'Expires: '}
                  {expiryInfo.date.toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        <CaseStatusBadge status={caseData.status} />
      </div>
    </div>
  );
}
