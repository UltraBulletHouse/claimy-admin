import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import CaseFilters from "../components/CaseFilters";
import CaseTable from "../components/CaseTable";
import LoadingState from "../components/LoadingState";
import { useAdminSession } from "../context/AdminSessionContext";
import { useAdminApi } from "../hooks/useAdminApi";
import toast from "react-hot-toast";
import type { CaseRecord } from "../types/case";

interface CasesResponse {
  items: CaseRecord[];
  total: number;
}

export default function DashboardPage() {
  const { adminSession, loading, signIn } = useAdminSession();
  const api = useAdminApi();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [filters, setFilters] = useState<{ status?: string; q?: string }>({});
  const [fetching, setFetching] = useState(false);

  const loadCases = useCallback(
    async (nextSkip: number, nextFilters: { status?: string; q?: string }) => {
      if (!adminSession) return;
      setFetching(true);
      try {
        const params = new URLSearchParams();
        if (nextFilters.status) params.append("status", nextFilters.status);
        if (nextFilters.q) params.append("q", nextFilters.q);
        params.append("skip", String(nextSkip));
        params.append("limit", String(limit));
        const query = params.toString();
        const res = await api.get<CasesResponse>(
          `/api/admin/cases${query ? `?${query}` : ""}`
        );
        setCases(res.items);
        setTotal(res.total);
        setSkip(nextSkip);
      } catch (err: any) {
        toast.error(err.message ?? "Failed to load cases");
      } finally {
        setFetching(false);
      }
    },
    [adminSession, api, limit]
  );

  useEffect(() => {
    if (!adminSession) {
      return;
    }
    void loadCases(skip, filters);
  }, [adminSession, filters, loadCases, skip]);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <LoadingState message="Authenticating…" />
      </Layout>
    );
  }

  if (!adminSession) {
    return (
      <Layout title="Dashboard">
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Admin access required</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with the authorized Google account to view the dashboard.
          </p>
          <button
            onClick={() => signIn()}
            className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Sign in with Google
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <CaseFilters
        initialQuery={filters.q}
        initialStatus={filters.status}
        onFilterChange={(next) => {
          setFilters(next);
          setSkip(0);
        }}
        onSyncMail={async () => {
          try {
            await api.post("/api/admin/sync-mails", {});
            toast.success("Mail sync initiated");
            await loadCases(skip, filters);
          } catch (err: any) {
            toast.error(err.message ?? "Failed to sync mails");
          }
        }}
      />
      {fetching ? (
        <LoadingState message="Fetching cases…" />
      ) : (
        <CaseTable
          cases={cases}
          total={total}
          skip={skip}
          limit={limit}
          onPaginate={(nextSkip) => setSkip(nextSkip)}
        />
      )}
    </Layout>
  );
}
