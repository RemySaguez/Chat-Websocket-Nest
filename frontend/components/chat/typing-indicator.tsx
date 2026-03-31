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
  } else if (names.length === 2) {
    text = `${names[0]} et ${names[1]} sont en train d'écrire…`;
  } else {
    text = `Plusieurs personnes sont en train d'écrire (${names.join(", ")})…`;
  }

  return (
    <p className="px-4 py-2 text-xs italic text-[var(--on-surface-variant)]">
      {text}
    </p>
  );
}
