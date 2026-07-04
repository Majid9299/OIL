"use client";

import { createContext, useContext, useState } from "react";
import { Objection } from "@/lib/types";

interface ObjectionsContextValue {
  objections: Objection[];
  addObjection: (objection: Omit<Objection, "id" | "createdAt" | "status">) => void;
}

const ObjectionsContext = createContext<ObjectionsContextValue | null>(null);

export function ObjectionsProvider({ children }: { children: React.ReactNode }) {
  const [objections, setObjections] = useState<Objection[]>([]);

  function addObjection(objection: Omit<Objection, "id" | "createdAt" | "status">) {
    setObjections((prev) => [
      {
        ...objection,
        id: `OBJ-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "pending",
      },
      ...prev,
    ]);
  }

  return (
    <ObjectionsContext.Provider value={{ objections, addObjection }}>
      {children}
    </ObjectionsContext.Provider>
  );
}

export function useObjections() {
  const ctx = useContext(ObjectionsContext);
  if (!ctx) {
    throw new Error("useObjections must be used within ObjectionsProvider");
  }
  return ctx;
}
