"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) {
      router.replace("/login");
    }
  }, [ready, session, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--on-surface-variant)]">
        Chargement…
      </div>
    );
  }

  return session ? <>{children}</> : null;
}
