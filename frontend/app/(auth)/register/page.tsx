"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { mapAuthResponse, postRegister } from "@/lib/auth-api";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      return;
    }
    setPending(true);
    const { ok, data } = await postRegister({
      email: email.trim(),
      username: username.trim(),
      password,
      accentColor: "#5e5e60",
    });
    setPending(false);
    if (!ok || !("access_token" in data)) {
      const msg = "message" in data ? data.message : undefined;
      setError(
        Array.isArray(msg)
          ? msg.join(", ")
          : typeof msg === "string"
            ? msg
            : "Inscription impossible",
      );
      return;
    }
    login(mapAuthResponse(data));
    router.push("/chat");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="font-[family-name:var(--font-manrope)] text-xl font-semibold">
        Créer un compte
      </h1>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <InputField
        id="reg-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <InputField
        id="reg-username"
        label="Nom d'utilisateur"
        type="text"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <InputField
        id="reg-password"
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <InputField
        id="reg-confirm"
        label="Confirmer le mot de passe"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
      />
      <Button
        type="submit"
        disabled={pending || (password.length > 0 && password !== confirm)}
      >
        {pending ? "Création…" : "S'inscrire"}
      </Button>
      <p className="text-center text-sm text-[var(--on-surface-variant)]">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="text-[var(--primary)] underline decoration-[var(--outline-variant)]"
        >
          Connexion
        </Link>
      </p>
      <p className="text-center text-xs text-[var(--on-surface-variant)]">
        <Link href="/">Retour à l'accueil</Link>
      </p>
    </form>
  );
}
