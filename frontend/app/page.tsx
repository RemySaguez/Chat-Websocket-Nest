"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { session, ready, logout } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--on-surface-variant)]">
        Chargement…
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-tight">
        Chat Websocket Nest
      </h1>
      {session ? (
        <div className="flex flex-col gap-3">
          <Link href="/chat">
            <Button className="w-full sm:w-auto">Aller au chat</Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary" className="w-full sm:w-auto">
              Profil
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="text-left text-sm text-[var(--on-surface-variant)] underline decoration-[var(--outline-variant)]"
          >
            Se déconnecter
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/login">
            <Button className="w-full sm:w-auto">Connexion</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" className="w-full sm:w-auto">
              Créer un compte
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
}
