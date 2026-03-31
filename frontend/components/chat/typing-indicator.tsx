type TypingIndicatorProps = {
  names: string[];
};

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) {
    return null;
  }

  let text: string;
  if (names.length === 1) {
    text = `${names[0]} est en train d'écrire…`;
  } else {
    text = `${names.length} personnes sont en train d'écrire…`;
  }

  return (
    <p className="px-4 py-2 text-xs italic text-[var(--on-surface-variant)]">
      {text}
    </p>
  );
}
