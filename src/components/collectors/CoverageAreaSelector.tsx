"use client";

import { useState } from "react";
import { OMAN_GOVERNORATES } from "@/lib/mock-data";

interface CoverageAreaSelectorProps {
  selected: string[];
  onToggle: (wilayat: string) => void;
}

export function CoverageAreaSelector({ selected, onToggle }: CoverageAreaSelectorProps) {
  const [openGovernorate, setOpenGovernorate] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((w) => (
            <span
              key={w}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {OMAN_GOVERNORATES.map((gov) => {
          const isOpen = openGovernorate === gov.name;
          const selectedInGov = gov.wilayats.filter((w) => selected.includes(w)).length;
          return (
            <div key={gov.name}>
              <button
                type="button"
                onClick={() => setOpenGovernorate(isOpen ? null : gov.name)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm"
              >
                <span className="font-semibold text-neutral-800">{gov.name}</span>
                <span className="flex items-center gap-2">
                  {selectedInGov > 0 && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      {selectedInGov}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-1 bg-neutral-50 px-3 py-2">
                  {gov.wilayats.map((w) => (
                    <label
                      key={w}
                      className="flex items-center gap-2 py-1 text-sm text-neutral-600"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(w)}
                        onChange={() => onToggle(w)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                      />
                      {w}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
