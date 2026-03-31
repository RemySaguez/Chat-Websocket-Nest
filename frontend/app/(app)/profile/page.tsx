"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";

export default function ProfilePage() {
  const { session, updateProfile } = useAuth();
  const [username, setUsername] = useState(session?.username ?? "");
  const [accentColor, setAccentColor] = useState(session?.accentColor ?? "#5e5e60");
  const [notifyEmail, setNotifyEmail] = useState(true);

  if (!session) {
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      return;
    }
    updateProfile({
      username: username.trim() || session.username,
      accentColor,
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-[family-name:var(--font-manrope)] text-xl font-semibold">
        Paramètres du profil
      </h1>
      <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
        Modifiez votre nom d'utilisateur et votre couleur d'affichage.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <InputField
          id="profile-email"
          label="Email"
          type="email"
          value={session.email}
          disabled
          readOnly
        />
        <InputField
          id="profile-username"
          label="Nom d'utilisateur"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--on-surface-variant)]">
            Couleur d'affichage
          </span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Couleur d'affichage"
            />
            <input
              className="input-ghost flex-1 rounded-lg bg-white px-3 py-2 text-sm"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              pattern="^#([0-9a-fA-F]{6})$"
              aria-label="Code couleur hexadécimal"
            />
          </div>
        </div>
        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  );
}
