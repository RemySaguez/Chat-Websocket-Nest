"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthSession } from "@/lib/types";
import { AUTH_SESSION_KEY } from "@/lib/constants";
import { fetchMe, patchProfile } from "@/lib/auth-api";

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  updateProfile: (patch: {
    username?: string;
    accentColor?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  const applySession = useCallback((next: AuthSession) => {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (typeof window === "undefined") {
        return;
      }
      const stored = readStoredSession();
      if (!stored?.accessToken) {
        if (!cancelled) {
          setReady(true);
        }
        return;
      }
      const user = await fetchMe(stored.accessToken);
      if (cancelled) {
        return;
      }
      if (!user) {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        setSession(null);
        setReady(true);
        return;
      }
      setSession({
        accessToken: stored.accessToken,
        id: user.id,
        email: user.email,
        username: user.username,
        accentColor: user.accentColor,
      });
      sessionStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({
          accessToken: stored.accessToken,
          id: user.id,
          email: user.email,
          username: user.username,
          accentColor: user.accentColor,
        }),
      );
      setReady(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((next: AuthSession) => {
    applySession(next);
  }, [applySession]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setSession(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: { username?: string; accentColor?: string }) => {
      if (!session) {
        return { ok: false, error: "Session introuvable" };
      }
      const { ok, data } = await patchProfile(session.accessToken, patch);
      if (!ok || !("id" in data)) {
        const msg = "message" in data ? data.message : undefined;
        return {
          ok: false,
          error: Array.isArray(msg)
            ? msg.join(", ")
            : typeof msg === "string"
              ? msg
              : "Mise à jour impossible",
        };
      }
      applySession({
        accessToken: session.accessToken,
        id: data.id,
        email: data.email,
        username: data.username,
        accentColor: data.accentColor,
      });
      return { ok: true };
    },
    [session, applySession],
  );

  const value = useMemo(
    () => ({ session, ready, login, logout, updateProfile }),
    [session, ready, login, logout, updateProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
