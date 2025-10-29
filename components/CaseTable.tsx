import { useRouter } from "next/router";
import CaseStatusBadge from "./CaseStatusBadge";
import type { CaseRecord } from "../types/case";

interface Props {
  cases: CaseRecord[];
  total: number;
  onPaginate: (offset: number) => void;
  limit: number;
  skip: number;
}

export default function CaseTable({ cases, total, onPaginate, limit, skip }: Props) {
  const router = useRouter();
  const goTo = (id: string) => router.push(`/cases/${id}`);
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Case
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Store
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cases.map((caseItem) => (
            <tr key={caseItem._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => goTo(caseItem._id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTo(caseItem._id); }}>
              <td className="px-4 py-4 text-sm font-medium text-indigo-600">
                <span className="hover:underline">
                  {caseItem.productName ?? caseItem.product ?? caseItem.description ?? "Untitled"}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {caseItem.storeName ?? caseItem.store ?? "—"}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {caseItem.userEmail ?? "—"}
              </td>
              <td className="px-4 py-4 text-sm text-slate-500">
                {new Date(caseItem.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-4 text-sm">
                <CaseStatusBadge status={caseItem.status} />
              </td>
            </tr>
          ))}
          {!cases.length && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                No cases found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
        <span>
          Showing {Math.min(skip + 1, total)}-{Math.min(skip + cases.length, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={skip === 0}
            onClick={() => onPaginate(Math.max(0, skip - limit))}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={skip + limit >= total}
            onClick={() => onPaginate(skip + limit)}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
