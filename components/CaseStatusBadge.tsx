import clsx from "clsx";
import type { CaseStatus } from "../types/case";

const statusStyles: Record<CaseStatus, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  NEED_INFO: "bg-rose-100 text-rose-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700"
};

function normalizeStatus(input: unknown): CaseStatus | string {
  const raw = typeof input === "string" ? input : String(input ?? "PENDING");
  // Map legacy/lowercase variants to the canonical admin statuses
  const map: Record<string, CaseStatus> = {
    new: "PENDING",
    inreview: "IN_REVIEW",
    "in_review": "IN_REVIEW",
    sent: "IN_REVIEW",
    waitingreply: "NEED_INFO",
    "waiting_reply": "NEED_INFO",
    needmoreinfo: "NEED_INFO",
    "need_more_info": "NEED_INFO",
    approved: "APPROVED",
    rejected: "REJECTED",
    pending: "PENDING",
    "in review": "IN_REVIEW",
    "need info": "NEED_INFO"
  };
  const key = raw.replace(/\s+/g, "_").toLowerCase();
  return map[key] ?? raw.toUpperCase().replace(/\s+/g, "_");
}

function formatStatusLabel(status: unknown) {
  const s = String(status ?? "");
  return s
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface Props {
  status: CaseStatus | string | undefined;
}

export default function CaseStatusBadge({ status }: Props) {
  const normalized = normalizeStatus(status);
  const style = (statusStyles as Record<string, string>)[normalized] ?? "bg-slate-200 text-slate-700";
  return (
    <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", style)}>
      {formatStatusLabel(normalized)}
    </span>
  );
}
