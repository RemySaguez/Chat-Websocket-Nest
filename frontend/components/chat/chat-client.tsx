"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";
const INITIAL_MESSAGES: ChatMessage[] = [];

function toggleReactionOnMessage(
  msg: ChatMessage,
  emoji: string,
  userName: string,
): ChatMessage {
  const others = msg.reactions.filter((r) => r.emoji !== emoji);
  const existing = msg.reactions.find((r) => r.emoji === emoji);
  const hadUser = existing?.userNames.includes(userName);
  const nextNames = existing
    ? hadUser
      ? existing.userNames.filter((u) => u !== userName)
      : [...existing.userNames, userName]
    : [userName];
  const nextReaction =
    nextNames.length > 0
      ? [{ emoji, userNames: nextNames }]
      : [];
  return {
    ...msg,
    reactions: [...others, ...nextReaction].sort((a, b) =>
      a.emoji.localeCompare(b.emoji),
    ),
  };
}

export function ChatClient() {
  const { session } = useAuth();
  const meId = session?.id ?? "local-user";
  const userName = session?.username ?? "Moi";
  const userColor = session?.accentColor ?? "#5e5e60";

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [typingNames] = useState<string[]>([]);

  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? toggleReactionOnMessage(m, emoji, userName)
            : m,
        ),
      );
    },
    [userName],
  );

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    const next: ChatMessage = {
      id: `m-${Date.now()}`,
      authorId: meId,
      authorName: userName,
      authorColor: userColor,
      text,
      reactions: [],
    };
    setMessages((prev) => [...prev, next]);
    setDraft("");
  }, [draft, userName, userColor, meId]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[rgb(171_179_185/0.12)] px-4 py-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-lg font-semibold">
            Chat général
          </h1>
        </div>
        <Link
          href="/rooms/new"
          className="text-sm text-[var(--primary)] underline decoration-[var(--outline-variant)] underline-offset-2"
        >
          Nouveau salon
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-2">
        {messages.length > 0 ? (
          <div>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isOwn={m.authorId === meId}
                onToggleReaction={handleToggleReaction}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--on-surface-variant)]">
            Aucun message.
          </p>
        )}
        <TypingIndicator names={typingNames} />
      </div>

      <footer className="shrink-0 border-t border-[rgb(171_179_185/0.12)] bg-[var(--surface-container)] px-4 py-3">
        <div className="flex gap-2">
          <input
            className="input-ghost min-h-11 flex-1 rounded-lg bg-white px-3 text-sm"
            placeholder="Écrire un message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            aria-label="Message"
          />
          <Button type="button" onClick={sendMessage}>
            Envoyer
          </Button>
        </div>
      </footer>
    </div>
  );
}
