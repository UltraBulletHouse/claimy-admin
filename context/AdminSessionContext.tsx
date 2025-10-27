import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebaseClient";
import toast from "react-hot-toast";

interface AdminSession {
  adminEmail: string;
  token: string;
  firebaseIdToken: string;
  expiresAt: string;
}

interface AdminSessionContextValue {
  adminSession: AdminSession | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | undefined>(
  undefined
);

const allowedEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getFirebaseAuth();

  const fetchSessionToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setAdminSession(null);
      return;
    }
    const idToken = await currentUser.getIdToken(/* forceRefresh */ true);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    setAdminSession({
      adminEmail: currentUser.email ?? "",
      token: data.token,
      firebaseIdToken: idToken,
      expiresAt: data.expiresAt
    });
  }, [auth]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminSession(null);
        setLoading(false);
        return;
      }
      if (!user.email || user.email !== allowedEmail) {
        toast.error("Access denied for this Google account");
        await signOut(auth);
        setAdminSession(null);
        setLoading(false);
        return;
      }
      try {
        await fetchSessionToken();
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to create admin session");
        setAdminSession(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [auth, fetchSessionToken]);

  useEffect(() => {
    if (!adminSession) return;
    const expiry = new Date(adminSession.expiresAt).getTime();
    const timeout = expiry - Date.now() - 60 * 1000;
    if (timeout <= 0) {
      void fetchSessionToken();
      return;
    }
    const timer = setTimeout(() => {
      void fetchSessionToken();
      toast("Refreshing admin session");
    }, timeout);
    return () => clearTimeout(timer);
  }, [adminSession, fetchSessionToken]);

  const signInHandler = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Use redirect-based sign-in to avoid COOP/COEP popup issues in some browsers/hosts
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to sign in");
      setLoading(false);
    }
  }, [auth]);

  const signOutHandler = useCallback(async () => {
    await signOut(auth);
    setAdminSession(null);
  }, [auth]);

  const value = useMemo(
    () => ({
      adminSession,
      loading,
      signIn: signInHandler,
      signOutAdmin: signOutHandler,
      refreshSession: fetchSessionToken
    }),
    [adminSession, loading, signInHandler, signOutHandler, fetchSessionToken]
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
