"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { ChatClient } from "@/components/chat/chat-client";
import { Button } from "@/components/ui/button";
import {
  fetchAvailableUsers,
  fetchRoom,
  postRoomMember,
} from "@/lib/rooms-api";
import type { AvailableUser, RoomDetail, RoomMember } from "@/lib/types";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = useMemo(() => {
    const value = params?.id;
    return typeof value === "string" ? value : "";
  }, [params]);
  const { session } = useAuth();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.accessToken || !roomId) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }
      const nextRoom = await fetchRoom(session.accessToken, roomId);
      if (!cancelled) {
        setRoom(nextRoom);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [roomId, session?.accessToken]);

  async function onToggleUserPicker() {
    if (!session?.accessToken || !roomId) {
      return;
    }
    if (!showUserPicker) {
      setLoadingUsers(true);
      const users = await fetchAvailableUsers(session.accessToken, roomId);
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

  async function onAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || !roomId) {
      return;
    }
    const selectedUsers = availableUsers.filter((user) =>
      selectedUserIds.includes(user.id),
    );
    if (selectedUsers.length === 0) {
      setError("Sélectionnez au moins un utilisateur");
      return;
    }
    setSubmitting(true);
    setError(null);
    const results = await Promise.all(
      selectedUsers.map((user) =>
        postRoomMember(session.accessToken as string, roomId, {
          username: user.username,
          canSeePriorHistory: includeHistory,
        }),
      ),
    );
    setSubmitting(false);
    const failed = results.find((result) => !result.ok || !("userId" in result.data));
    if (failed) {
      setError(failed.error ?? "Ajout impossible");
      return;
    }
    const addedMembers = results.map((result) => result.data as RoomMember);
    setRoom((prev) =>
      prev
        ? {
            ...prev,
            members: [
              ...prev.members,
              ...addedMembers.filter(
                (member, index, members) =>
                  members.findIndex((entry) => entry.userId === member.userId) ===
                    index &&
                  !prev.members.some((entry) => entry.userId === member.userId),
              ),
            ],
          }
        : prev,
    );
    setAvailableUsers((prev) =>
      prev.filter((user) => !selectedUserIds.includes(user.id)),
    );
    setSelectedUserIds([]);
    setIncludeHistory(false);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-sm text-[var(--on-surface-variant)]">Chargement...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-[var(--on-surface-variant)]">
          Salon introuvable.
        </p>
        <Link href="/rooms">
          <Button variant="secondary">Retour aux salons</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col lg:flex-row">
      <div className="min-h-0 flex-1">
        <ChatClient
          roomId={room.id}
          title={room.name}
          linkHref="/rooms"
          linkLabel="Tous les salons"
        />
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-5 border-t border-[rgb(171_179_185/0.12)] bg-[var(--surface-container)] px-4 py-4 lg:w-80 lg:border-l lg:border-t-0">
        <div>
          <h2 className="font-[family-name:var(--font-manrope)] text-lg font-semibold">
            Membres
          </h2>
          <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
            Invitez des utilisateurs. L&apos;option historique s&apos;applique à cet ajout.
          </p>
        </div>

        <form onSubmit={onAddMember} className="flex flex-col gap-3">
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
            <div className="max-h-56 overflow-y-auto rounded-xl border border-[rgb(171_179_185/0.16)] bg-[var(--surface)] p-3">
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
            />
            Voir l&apos;historique
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Ajout..." : "Ajouter"}
          </Button>
        </form>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {room.members.map((member) => (
            <div
              key={member.userId}
              className="rounded-xl border border-[rgb(171_179_185/0.16)] bg-[var(--surface)] px-3 py-3"
            >
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: member.accentColor }}
                >
                  {member.username}
                </p>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  {member.isCreator ? "Créateur" : "Membre"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
