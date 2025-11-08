import Link from "next/link";
import { useRouter } from "next/router";
import { useAdminSession } from "../context/AdminSessionContext";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
  const { adminSession, signOutAdmin, signIn, loading } = useAdminSession();
  const router = useRouter();
  const pathname = router.pathname;

  const navItems = [
    {
      href: "/",
      label: "Cases",
      isActive(path: string) {
        return path === "/" || path.startsWith("/cases");
      }
    },
    {
      href: "/stores",
      label: "Stores",
      isActive(path: string) {
        return path === "/stores";
      }
    }
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Claimy Admin</h1>
            <p className="text-sm text-slate-500">Internal dashboard</p>
          </div>
          <nav className="flex gap-4">
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition ${
                    active ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div>
          {loading ? (
            <span className="text-sm text-slate-500">Loading…</span>
          ) : adminSession ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
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
