import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import LoadingState from "../components/LoadingState";
import { useAdminSession } from "../context/AdminSessionContext";
import { useAdminApi } from "../hooks/useAdminApi";
import toast from "react-hot-toast";
import type { StoreRecord } from "../types/store";

interface StoresResponse {
  items: StoreRecord[];
  total: number;
}

const DEFAULT_COLOR = "#3568FF";

interface StoreFormState {
  storeId: string;
  name: string;
  primaryColor: string;
  email: string;
}

export default function StoresPage() {
  const { adminSession, loading, signIn } = useAdminSession();
  const api = useAdminApi();

  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [formState, setFormState] = useState<StoreFormState>({
    storeId: "",
    name: "",
    primaryColor: DEFAULT_COLOR,
    email: ""
  });

  const isEditing = useMemo(() => editingStoreId !== null, [editingStoreId]);

  const resetForm = useCallback(() => {
    setEditingStoreId(null);
    setFormState({
      storeId: "",
      name: "",
      primaryColor: DEFAULT_COLOR,
      email: ""
    });
  }, []);

  const loadStores = useCallback(async () => {
    if (!adminSession) return;
    setFetching(true);
    try {
      const res = await api.get<StoresResponse>("/api/admin/stores");
      setStores(res.items);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to fetch stores");
    } finally {
      setFetching(false);
    }
  }, [adminSession, api]);

  useEffect(() => {
    if (!adminSession) {
      setStores([]);
      return;
    }
    void loadStores();
  }, [adminSession, loadStores]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      const payload = {
        storeId: formState.storeId.trim(),
        name: formState.name.trim(),
        primaryColor: formState.primaryColor.trim(),
        email: formState.email.trim()
      };

      if (!payload.storeId || !payload.name || !payload.primaryColor || !payload.email) {
        toast.error("Please fill in all the fields.");
        return;
      }

      setSubmitting(true);
      try {
        if (editingStoreId) {
          const updated = await api.put<StoreRecord>(
            `/api/admin/stores/${encodeURIComponent(editingStoreId)}`,
            payload
          );
          setStores((prev) => {
            const next = prev.filter((store) => store.id !== updated.id);
            return [...next, updated].sort((a, b) => a.name.localeCompare(b.name));
          });
          setEditingStoreId(updated.storeId);
          setFormState({
            storeId: updated.storeId,
            name: updated.name,
            primaryColor: updated.primaryColor,
            email: updated.email
          });
          toast.success("Store updated.");
        } else {
          const created = await api.post<StoreRecord>("/api/admin/stores", payload);
          setStores((prev) => {
            const next = [...prev, created];
            return next.sort((a, b) => a.name.localeCompare(b.name));
          });
          resetForm();
          toast.success("Store created.");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message ?? "Failed to save the store");
      } finally {
        setSubmitting(false);
      }
    },
    [api, editingStoreId, formState.email, formState.name, formState.primaryColor, formState.storeId, resetForm, submitting]
  );

  const startEditing = useCallback((store: StoreRecord) => {
    setEditingStoreId(store.storeId);
    setFormState({
      storeId: store.storeId,
      name: store.name,
      primaryColor: store.primaryColor,
      email: store.email
    });
  }, []);

  if (loading) {
    return (
      <Layout title="Stores">
        <LoadingState message="Authenticating…" />
      </Layout>
    );
  }

  if (!adminSession) {
    return (
      <Layout title="Stores">
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Admin access required</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with the authorized Google account to manage stores.
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
    <Layout title="Stores">
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit store" : "Add a new store"}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create another
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Stores sync with the customer app. Configure brand colors and contact email here.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Store ID
                <span className="ml-1 text-xs text-slate-400">(slug, lowercase)</span>
              </label>
              <input
                type="text"
                value={formState.storeId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, storeId: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="e.g. freshmart"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Display name</label>
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="FreshMart Market"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Primary color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="text"
                  value={formState.primaryColor}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, primaryColor: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="#3568FF"
                />
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300"
                  style={{ backgroundColor: formState.primaryColor || "#ffffff" }}
                  aria-hidden
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Use a 6-digit hex value. The color powers the customer app buttons.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contact email</label>
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="team@brand.com"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving…" : isEditing ? "Save changes" : "Add store"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Configured stores</h2>
            <button
              type="button"
              onClick={() => {
                resetForm();
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + New store
            </button>
          </div>
          {fetching ? (
            <LoadingState message="Loading stores…" />
          ) : stores.length === 0 ? (
            <p className="text-sm text-slate-500">
              No stores configured yet. Add the first store using the form on the left.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Store ID</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {stores
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((store) => (
                      <tr key={store.id}>
                        <td className="px-4 py-3 text-slate-800">{store.name}</td>
                        <td className="px-4 py-3 text-slate-500">{store.storeId}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-slate-600">
                            <span
                              className="inline-flex h-5 w-5 rounded-full border border-slate-200"
                              style={{ backgroundColor: store.primaryColor }}
                              aria-hidden
                            />
                            {store.primaryColor}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{store.email}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => startEditing(store)}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
