import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-dim)_100%)] text-[var(--on-primary)]"
      : "bg-[var(--surface-container)] text-[var(--on-surface)]";
  return (
    <button
      type={type}
      className={`${base} ${styles} ${className}`.trim()}
      {...props}
    />
  );
}
