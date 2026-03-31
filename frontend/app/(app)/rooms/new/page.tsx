"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";

export default function NewRoomPage() {
  const [name, setName] = useState("");
  const [invitees, setInvitees] = useState("");
  const [includeHistory, setIncludeHistory] = useState(true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        <div className="flex flex-col gap-1">
          <label
            htmlFor="room-invitees"
            className="text-xs font-medium text-[var(--on-surface-variant)]"
          >
            Inviter des utilisateurs
          </label>
          <textarea
            id="room-invitees"
            className="input-ghost min-h-24 rounded-lg bg-white px-3 py-2 text-sm"
            value={invitees}
            onChange={(e) => setInvitees(e.target.value)}
          />
        </div>
        <Button type="submit">Créer le salon</Button>
      </form>
    </div>
  );
}
