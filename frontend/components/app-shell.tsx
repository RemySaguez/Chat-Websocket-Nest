"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, session } = useAuth();

  const linkClass = (href: string) => {
    const active =
      href === "/rooms" ? pathname.startsWith("/rooms") : pathname === href;
    return `block rounded-lg px-3 py-2 text-sm ${
      active
        ? "bg-[var(--surface-container-high)] text-[var(--on-surface)]"
        : "text-[var(--on-surface)] hover:bg-[var(--surface-low)]"
    }`;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col gap-6 bg-[var(--surface-low)] px-3 py-6 md:w-64">
        <div className="px-2">
          <p className="font-[family-name:var(--font-manrope)] text-sm font-semibold tracking-tight">
            Websocket Nest
          </p>
          <p
            className="mt-1 truncate text-xs"
            style={{
              color: session?.accentColor ?? "var(--on-surface-variant)",
            }}
          >
            {session?.username}
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          <Link href="/chat" className={linkClass("/chat")}>
            Chat général
          </Link>
          <Link href="/rooms" className={linkClass("/rooms")}>
            Salons
          </Link>
          <Link href="/profile" className={linkClass("/profile")}>
            Profil
          </Link>
        </nav>
        <div className="mt-auto px-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => logout()}
          >
            Déconnexion
          </Button>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--surface)]">
        {children}
      </div>
    </div>
  );
}
