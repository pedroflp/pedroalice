import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = {
  authenticated: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ authenticated: false, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_KEY = "pedroalice_authenticated";
const GUEST_EMAIL = import.meta.env.VITE_SUPABASE_GUEST_EMAIL as string;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ authenticated: false, loading: true });

  useEffect(() => {
    async function init() {
      // 1. Check URL for token (password)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");

      if (urlToken) {
        // Clean token from URL immediately
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());

        console.log(GUEST_EMAIL, urlToken)

        // Sign in with the guest user using token as password
        const { error } = await supabase.auth.signInWithPassword({
          email: GUEST_EMAIL,
          password: urlToken,
        });

        if (error) {
          console.error("Sign-in failed:", error.message);
          setState({ authenticated: false, loading: false });
          return;
        }

        sessionStorage.setItem(SESSION_KEY, "1");
        setState({ authenticated: true, loading: false });
        return;
      }

      // 2. Check existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setState({ authenticated: true, loading: false });
        return;
      }

      // 3. No token, no session → blocked
      setState({ authenticated: false, loading: false });
    }

    init();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
