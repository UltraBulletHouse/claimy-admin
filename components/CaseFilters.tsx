import { useState } from "react";
import CaseStatusBadge from "./CaseStatusBadge";
const STATUS_OPTIONS = ["ALL", "PENDING", "IN_REVIEW", "NEED_INFO", "APPROVED", "REJECTED"] as const;

interface Props {
  onFilterChange: (filters: { status?: string; q?: string }) => void;
  initialStatus?: string;
  initialQuery?: string;
  onSyncMail: () => Promise<void>;
}

export default function CaseFilters({
  onFilterChange,
  initialQuery,
  initialStatus,
  onSyncMail
}: Props) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [status, setStatus] = useState(initialStatus ?? "ALL");

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onFilterChange({ status, q: e.target.value });
          }}
          placeholder="Search by store, product or user email"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
        />
        <button
          onClick={() => {
            setQuery("");
            setStatus("ALL");
            onFilterChange({ status: undefined, q: "" });
          }}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => {
              const value = option === "ALL" ? undefined : option;
              setStatus(option);
              onFilterChange({ status: value, q: query });
            }}
            className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold transition hover:bg-slate-100"
          >
            {option === "ALL" ? (
              <span className="capitalize text-slate-600">All</span>
            ) : (
              <CaseStatusBadge status={option} />
            )}
          </button>
        ))}
        <button
          onClick={() => onSyncMail()}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sync mail
        </button>
      </div>
    </div>
  );
}
