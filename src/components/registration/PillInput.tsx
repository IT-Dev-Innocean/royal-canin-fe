import type { InputHTMLAttributes } from "react";

type PillInputProps = {
  label: string;
  hint?: string;
  id: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export function PillInput({ label, hint, id, ...rest }: PillInputProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="rounded-full bg-[#e2001a] px-5 py-3 shadow-sm">
        <p className="text-sm font-semibold text-white">{label}</p>
        {hint ? (
          <p className="mt-1 text-xs italic leading-snug text-white/90">{hint}</p>
        ) : null}
        <input
          id={id}
          className="mt-2 w-full border-0 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-0"
          {...rest}
        />
      </div>
    </div>
  );
}
