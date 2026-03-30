import { Icon } from "@iconify/react";
import type { SelectHTMLAttributes } from "react";

type PillSelectProps = {
  label: string;
  id: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">;

export function PillSelect({ label, id, children, ...rest }: PillSelectProps) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative rounded-full bg-[#e2001a] px-5 py-3 pr-12 shadow-sm">
        <p className="text-sm font-semibold text-white">{label}</p>
        <select
          id={id}
          className="mt-2 w-full cursor-pointer appearance-none border-0 bg-transparent text-sm text-white focus:outline-none focus:ring-0 [&>option]:text-neutral-900"
          {...rest}
        >
          {children}
        </select>
        <Icon
          icon="mdi:chevron-down"
          className="pointer-events-none absolute right-4 top-[calc(50%+0.5rem)] h-6 w-6 -translate-y-1/2 text-white"
          aria-hidden
        />
      </div>
    </div>
  );
}
