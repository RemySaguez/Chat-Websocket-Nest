import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";

const QUICK_EMOJIS = ["🔥", "👍", "😂"];

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
};

export function MessageBubble({
  message,
  isOwn,
  onToggleReaction,
}: MessageBubbleProps) {
  const bubble = isOwn
    ? "ml-auto max-w-[min(85%,28rem)] rounded-lg bg-[var(--primary)] px-3 py-2 text-[var(--on-primary)]"
    : "mr-auto max-w-[min(85%,28rem)] rounded-lg bg-[var(--surface-incoming)] px-3 py-2 text-[var(--on-surface)]";

  return (
    <div className="message-row flex flex-col gap-1 py-2">
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <span
          className="mb-0.5 text-xs font-medium"
          style={{ color: message.authorColor }}
        >
          {message.authorName}
        </span>
        <div className={bubble}>
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        {message.reactions.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--on-surface-variant)]">
            {message.reactions.map((r) => (
              <li key={r.emoji}>
                <button
                  type="button"
                  className="rounded border border-[rgb(171_179_185/0.2)] bg-white/80 px-1.5 py-0.5 hover:bg-[var(--surface-low)]"
                  onClick={() => onToggleReaction(message.id, r.emoji)}
                >
                  {r.emoji}{" "}
                  {r.userNames.length > 0
                    ? r.userNames.join(", ")
                    : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-1 flex flex-wrap gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={() => onToggleReaction(message.id, emoji)}
              aria-label={`Réagir avec ${emoji}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
