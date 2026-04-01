"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { fetchRooms } from "@/lib/rooms-api";
import type { RoomSummary } from "@/lib/types";

export default function RoomsPage() {
  const { session } = useAuth();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.accessToken) {
        if (!cancelled) {
          setRooms([]);
          setLoading(false);
        }
        return;
      }
      const nextRooms = await fetchRooms(session.accessToken);
      if (!cancelled) {
        setRooms(nextRooms);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-semibold">
            Salons
          </h1>
        </div>
        <Link href="/rooms/new">
          <Button>Nouveau salon</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-[var(--on-surface-variant)]">
            Chargement...
          </p>
        ) : rooms.length > 0 ? (
          rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="rounded-xl border border-[rgb(171_179_185/0.16)] bg-[var(--surface-container)] px-4 py-3 transition hover:bg-[var(--surface-container-high)]"
            >
              <p className="font-medium">{room.name}</p>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[rgb(171_179_185/0.2)] px-4 py-8 text-center">
            <p className="text-sm text-[var(--on-surface-variant)]">
              Aucun salon pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
