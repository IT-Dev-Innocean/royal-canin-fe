"use client";

import { SCRUB_SIZE_COLUMNS, SCRUB_TABLE_ROWS } from "@/lib/scrub-size-data";
import { useRegistrationForm } from "@/context/RegistrationFormContext";
import type { ScrubSize } from "@/types/registration";

export function ScrubSizeSection() {
  const { form, setField } = useRegistrationForm();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[520px] border-collapse text-center text-xs">
          <thead>
            <tr className="bg-[#e2001a] text-white">
              <th className="px-2 py-2 font-semibold">UKURAN</th>
              {SCRUB_SIZE_COLUMNS.map((col) => (
                <th key={col} className="px-1 py-2 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-neutral-800">
            {SCRUB_TABLE_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-neutral-200">
                <td className="bg-neutral-50 px-2 py-2 text-left font-medium">
                  <span className="text-[#e2001a]">{row.key}</span>{" "}
                  {row.label}
                </td>
                {SCRUB_SIZE_COLUMNS.map((col) => (
                  <td key={col} className="px-1 py-2">
                    {row.values[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-sm font-semibold text-[#e2001a]">
        Pilih ukuran Scrub
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SCRUB_SIZE_COLUMNS.map((size) => {
          const active = form.scrubSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setField("scrubSize", size as ScrubSize)}
              className={`min-w-[2.75rem] rounded-full border-2 px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[#e2001a] bg-[#e2001a] text-white"
                  : "border-[#e2001a] bg-white text-[#e2001a] hover:bg-red-50"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
