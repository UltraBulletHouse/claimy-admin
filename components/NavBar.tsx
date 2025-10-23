import { useAdminSession } from "../context/AdminSessionContext";

export default function NavBar() {
  const { adminSession, signOutAdmin, signIn, loading } = useAdminSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Claimy Admin</h1>
          <p className="text-sm text-slate-500">Internal dashboard</p>
        </div>
        <div>
          {loading ? (
            <span className="text-sm text-slate-500">Loading…</span>
          ) : adminSession ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{adminSession.adminEmail}</span>
              <button
                onClick={() => signOutAdmin()}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
