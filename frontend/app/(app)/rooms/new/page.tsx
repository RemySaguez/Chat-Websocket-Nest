"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { fetchAvailableUsers, postRoom } from "@/lib/rooms-api";
import type { AvailableUser } from "@/lib/types";

export default function NewRoomPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggleUserPicker() {
    if (!session?.accessToken) {
      setError("Session introuvable");
      return;
    }
    if (!showUserPicker && availableUsers.length === 0) {
      setLoadingUsers(true);
      const users = await fetchAvailableUsers(session.accessToken);
      setAvailableUsers(users);
      setLoadingUsers(false);
    }
    setShowUserPicker((prev) => !prev);
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) {
      setError("Session introuvable");
      return;
    }
    setSubmitting(true);
    setError(null);
    const inviteUsernames = availableUsers
      .filter((user) => selectedUserIds.includes(user.id))
      .map((user) => user.username);
    const result = await postRoom(session.accessToken, {
      name,
      inviteUsernames,
    });
    setSubmitting(false);
    if (!result.ok || !("id" in result.data)) {
      setError(result.error ?? "Création impossible");
      return;
    }
    router.push(`/rooms/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-[family-name:var(--font-manrope)] text-xl font-semibold">
        Nouveau salon
      </h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <InputField
          id="room-name"
          label="Nom du salon"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onToggleUserPicker()}
            disabled={loadingUsers}
          >
            {loadingUsers
              ? "Chargement..."
              : showUserPicker
                ? "Masquer les utilisateurs"
                : "Inviter des utilisateurs"}
          </Button>
          {showUserPicker ? (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-[rgb(171_179_185/0.16)] bg-[var(--surface-container)] p-3">
              {availableUsers.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {availableUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                      />
                      <span style={{ color: user.accentColor }}>{user.username}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--on-surface-variant)]">
                  Aucun utilisateur disponible.
                </p>
              )}
            </div>
          ) : null}
          <p className="text-xs text-[var(--on-surface-variant)]">
            {selectedUserIds.length} utilisateur
            {selectedUserIds.length > 1 ? "s sélectionnés" : " sélectionné"}
          </p>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Création..." : "Créer le salon"}
        </Button>
      </form>
    </div>
  );
}
