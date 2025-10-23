import type { AppProps } from "next/app";
import { AdminSessionProvider } from "../context/AdminSessionContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AdminSessionProvider>
      <Component {...pageProps} />
    </AdminSessionProvider>
  );
}
