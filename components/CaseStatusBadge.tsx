import clsx from "clsx";
import type { CaseStatus } from "../types/case";

const statusStyles: Record<CaseStatus, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  NEED_INFO: "bg-rose-100 text-rose-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700"
};

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface Props {
  status: CaseStatus | string;
}

export default function CaseStatusBadge({ status }: Props) {
  const style = (statusStyles as Record<string, string>)[status] ?? "bg-slate-200 text-slate-700";
  return (
    <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", style)}>
      {formatStatusLabel(status)}
    </span>
  );
}
