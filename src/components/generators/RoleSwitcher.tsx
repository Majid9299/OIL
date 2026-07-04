"use client";

import { useGeneratorData } from "./GeneratorDataProvider";

export function RoleSwitcher() {
  const { role, setRole } = useGeneratorData();

  return (
    <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 text-xs font-semibold">
      <button
        onClick={() => setRole("owner")}
        className={`rounded-full px-3 py-1.5 transition ${
          role === "owner" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
        }`}
      >
        المالك
      </button>
      <button
        onClick={() => setRole("authorized")}
        className={`rounded-full px-3 py-1.5 transition ${
          role === "authorized" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
        }`}
      >
        موظف مخوّل
      </button>
    </div>
  );
}
