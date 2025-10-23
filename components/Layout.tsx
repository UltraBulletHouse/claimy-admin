import Head from "next/head";
import { Toaster } from "react-hot-toast";
import NavBar from "./NavBar";

export default function Layout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Claimy Admin` : "Claimy Admin"}</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </>
  );
}
