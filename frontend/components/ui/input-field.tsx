import type { InputHTMLAttributes } from "react";

type InputFieldProps = {
  id: string;
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function InputField({
  id,
  label,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium text-[var(--on-surface-variant)]"
      >
        {label}
      </label>
      <input
        id={id}
        className={`input-ghost rounded-lg bg-white px-3 py-2 text-sm text-[var(--on-surface)] ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
