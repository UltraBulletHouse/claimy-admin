import clsx from "clsx";
import type { CaseStatus } from "../types/case";

const statusStyles: Record<CaseStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  inReview: "bg-amber-100 text-amber-700",
  sent: "bg-purple-100 text-purple-700",
  waitingReply: "bg-indigo-100 text-indigo-700",
  needMoreInfo: "bg-rose-100 text-rose-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700"
};

export default function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
