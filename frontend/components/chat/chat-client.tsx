"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/components/auth-context";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";
import { API_URL } from "@/lib/constants";

const INITIAL_MESSAGES: ChatMessage[] = [];

type ChatClientProps = {
  roomId?: string | null;
  title?: string;
  linkHref?: string;
  linkLabel?: string;
};

export function ChatClient({
  roomId = null,
  title = "Chat général",
  linkHref = "/rooms",
  linkLabel = "Salons",
}: ChatClientProps) {
  const { session } = useAuth();
  const meId = session?.id ?? "local-user";
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingRef = useRef(false);
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    const socket = io(API_URL, {
      auth: { token: session.accessToken },
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      if (roomId) {
        setMessages(INITIAL_MESSAGES);
        setTypingNames([]);
        typingRef.current = false;
        socket.emit("room:join", { roomId });
        return;
      }
      const hasDraft = draftRef.current.trim().length > 0;
      typingRef.current = false;
      if (hasDraft) {
        socket.emit("chat:typing", { typing: true });
        typingRef.current = true;
      }
    });
    socket.on("disconnect", () => {
      setConnected(false);
      setTypingNames([]);
    });
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Connexion au chat impossible");
    });
    socket.on("chat:error", (message: string) => {
      setError(message);
    });
    socket.on("chat:history", (history: ChatMessage[]) => {
      setError(null);
      setMessages(history);
    });
    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on(
      "chat:reaction",
      (payload: { messageId: string; reactions: ChatMessage["reactions"] }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? { ...m, reactions: payload.reactions }
              : m,
          ),
        );
      },
    );
    socket.on("chat:typing", (names: string[]) => {
      const me = session?.username;
      setTypingNames(me ? names.filter((name) => name !== me) : names);
    });
    return () => {
      if (socket.connected && typingRef.current) {
        socket.emit("chat:typing", { typing: false });
      }
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [roomId, session?.accessToken, session?.username]);

  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!socketRef.current?.connected) {
        return;
      }
      socketRef.current.emit("chat:toggleReaction", { messageId, emoji });
    },
    [],
  );

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text || !socketRef.current?.connected) {
      return;
    }
    socketRef.current.emit("chat:typing", { typing: false });
    typingRef.current = false;
    socketRef.current.emit("chat:send", { text });
    setDraft("");
  }, [draft]);

  useEffect(() => {
    const nextTyping = draft.trim().length > 0;
    if (!socketRef.current?.connected || typingRef.current === nextTyping) {
      return;
    }
    socketRef.current.emit("chat:typing", { typing: nextTyping });
    typingRef.current = nextTyping;
  }, [draft]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[rgb(171_179_185/0.12)] px-4 py-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-lg font-semibold">
            {title}
          </h1>
          <p className="text-xs text-[var(--on-surface-variant)]">
            {connected ? "Connecté" : "Déconnecté"}
          </p>
        </div>
        <Link
          href={linkHref}
          className="text-sm text-[var(--primary)] underline decoration-[var(--outline-variant)] underline-offset-2"
        >
          {linkLabel}
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-2">
        {error ? (
          <p className="pb-2 text-sm text-red-600">{error}</p>
        ) : null}
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
          <Button type="button" onClick={sendMessage} disabled={!connected}>
            Envoyer
          </Button>
        </div>
      </footer>
    </div>
  );
}
