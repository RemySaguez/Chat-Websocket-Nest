"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { mapAuthResponse, postLogin } from "@/lib/auth-api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { ok, data } = await postLogin({
      email: email.trim(),
      password,
    });
    setPending(false);
    if (!ok || !("access_token" in data)) {
      const msg = "message" in data ? data.message : undefined;
      setError(
        Array.isArray(msg)
          ? msg.join(", ")
          : typeof msg === "string"
            ? msg
            : "Connexion impossible",
      );
      return;
    }
    login(mapAuthResponse(data));
    router.push("/chat");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="font-[family-name:var(--font-manrope)] text-xl font-semibold">
        Connexion
      </h1>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <InputField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <InputField
        id="password"
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-[var(--on-surface-variant)]">
        <Link
          href="/register"
          className="text-[var(--primary)] underline decoration-[var(--outline-variant)]"
        >
          S'inscrire
        </Link>
      </p>
      <p className="text-center text-xs text-[var(--on-surface-variant)]">
        <Link href="/">Retour à l'accueil</Link>
      </p>
    </form>
  );
}
