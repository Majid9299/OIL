"use client";

import { createContext, useContext, useState } from "react";
import { SAMPLE_PENDING_REQUESTS } from "@/lib/mock-data";
import { PickupRequest } from "@/lib/types";

interface PickupRequestsContextValue {
  requests: PickupRequest[];
  addRequest: (request: Omit<PickupRequest, "id" | "status" | "createdAt">) => string;
  completeRequest: (id: string) => void;
}

const PickupRequestsContext = createContext<PickupRequestsContextValue | null>(null);

export function PickupRequestsProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<PickupRequest[]>(SAMPLE_PENDING_REQUESTS);

  function addRequest(request: Omit<PickupRequest, "id" | "status" | "createdAt">) {
    const id = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    setRequests((prev) => [
      { ...request, id, status: "pending", createdAt: new Date().toISOString() },
      ...prev,
    ]);
    return id;
  }

  function completeRequest(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r))
    );
  }

  return (
    <PickupRequestsContext.Provider value={{ requests, addRequest, completeRequest }}>
      {children}
    </PickupRequestsContext.Provider>
  );
}

export function usePickupRequests() {
  const ctx = useContext(PickupRequestsContext);
  if (!ctx) {
    throw new Error("usePickupRequests must be used within PickupRequestsProvider");
  }
  return ctx;
}
