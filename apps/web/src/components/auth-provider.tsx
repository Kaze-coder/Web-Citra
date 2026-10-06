"use client";

import { apiFetch, ApiError, clearApiCache, csrf } from "@/lib/api";
import type { Admin } from "@/lib/types";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextValue = {
  user: Admin;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const response = await apiFetch<{ user: Admin }>("/api/v1/auth/user");
    setUser(response.data.user);
  }

  useEffect(() => {
    let active = true;
    apiFetch<{ user: Admin }>("/api/v1/auth/user")
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) router.replace("/login");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    await csrf();
    await apiFetch<null>("/api/v1/auth/logout", { method: "POST", body: "{}" });
    clearApiCache();
    router.replace("/login");
    router.refresh();
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Memeriksa sesi aman
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
