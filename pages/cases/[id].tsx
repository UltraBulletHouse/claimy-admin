import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import LoadingState from "../../components/LoadingState";
import { useAdminSession } from "../../context/AdminSessionContext";
import { useAdminApi } from "../../hooks/useAdminApi";
import toast from "react-hot-toast";
import type { CaseRecord } from "../../types/case";
import CaseDetailHeader from "../../components/CaseDetailHeader";
import CaseDetailActions from "../../components/CaseDetailActions";
import CaseImages from "../../components/CaseImages";

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { adminSession, loading } = useAdminSession();
  const api = useAdminApi();

  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [fetching, setFetching] = useState(false);

  const loadCase = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setFetching(true);
    try {
      const data = await api.get<CaseRecord>(`/api/admin/cases/${id}`);
      setCaseData(data);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load case");
    } finally {
      setFetching(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (adminSession && id) {
      void loadCase();
    }
  }, [adminSession, id, loadCase]);

  if (loading || fetching) {
    return (
      <Layout title="Case detail">
        <LoadingState message="Loading case…" />
      </Layout>
    );
  }

  if (!adminSession) {
    return (
      <Layout title="Case detail">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          Sign in to view this case.
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout title="Case detail">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          Case not found.
        </div>
      </Layout>
    );
  }

  const pageTitle =
    caseData.productName ?? caseData.product ?? caseData.description ?? "Case detail";

  return (
    <Layout title={pageTitle}>
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        ← Back to cases
      </Link>
      <div className="grid gap-8 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-6">
          <CaseDetailHeader caseData={caseData} />
          <CaseImages
            productUrl={caseData.imageUrls?.product ?? caseData.images?.[0]}
            receiptUrl={caseData.imageUrls?.receipt ?? caseData.images?.[1]}
          />
        </div>
        <div className="space-y-6">
          <CaseDetailActions
            caseData={caseData}
            onCaseUpdate={(next) => setCaseData(next)}
            onDeleted={() => router.replace("/")}
          />
        </div>
      </div>
    </Layout>
  );
}
