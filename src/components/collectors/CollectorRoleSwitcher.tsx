"use client";

import { useCollectorData } from "./CollectorDataProvider";

export function CollectorRoleSwitcher() {
  const { role, setRole } = useCollectorData();

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
        onClick={() => setRole("driver")}
        className={`rounded-full px-3 py-1.5 transition ${
          role === "driver" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
        }`}
      >
        السائق
      </button>
    </div>
  );
}
