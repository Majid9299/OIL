"use client";

import { createContext, useContext, useState } from "react";
import { OIL_BATCHES } from "@/lib/mock-data";
import { CompanyRegistration, OilBatch, PermitDocument } from "@/lib/types";

interface FactoryDataContextValue {
  batches: OilBatch[];
  acceptBatch: (id: string, purchasedTons: number) => void;
  rejectBatch: (id: string) => void;
  markObjected: (id: string) => void;
  registration: CompanyRegistration;
  updateRegistration: (data: CompanyRegistration) => void;
  addRegistrationDocument: (document: Omit<PermitDocument, "id">) => void;
  removeRegistrationDocument: (documentId: string) => void;
}

const FactoryDataContext = createContext<FactoryDataContextValue | null>(null);

export function FactoryDataProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<OilBatch[]>(OIL_BATCHES);
  const [registration, setRegistration] = useState<CompanyRegistration>({
    companyName: "مصنع الخليج للصناعات الكيميائية",
    taxNumber: "",
    crNumber: "",
    whatsapp: "",
    email: "",
    documents: [],
  });

  // القبول يحدث فقط بعد تحديد كمية الشراء الفعلية بمربّع "شراء" — تُحدَّث
  // الدفعة لتعكس الكمية والمبلغ الفعليين المشتراة (قد تكون أقل من الكمية المعروضة)
  function acceptBatch(id: string, purchasedTons: number) {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: "accepted",
              tons: purchasedTons,
              totalOMR: Math.round(purchasedTons * b.pricePerTonOMR * 100) / 100,
            }
          : b
      )
    );
  }

  function rejectBatch(id: string) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, status: "rejected" } : b)));
  }

  function markObjected(id: string) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, status: "objected" } : b)));
  }

  function updateRegistration(data: CompanyRegistration) {
    setRegistration(data);
  }

  function addRegistrationDocument(document: Omit<PermitDocument, "id">) {
    setRegistration((prev) => ({
      ...prev,
      documents: [...prev.documents, { ...document, id: `doc-${Date.now()}` }],
    }));
  }

  function removeRegistrationDocument(documentId: string) {
    setRegistration((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== documentId),
    }));
  }

  return (
    <FactoryDataContext.Provider
      value={{
        batches,
        acceptBatch,
        rejectBatch,
        markObjected,
        registration,
        updateRegistration,
        addRegistrationDocument,
        removeRegistrationDocument,
      }}
    >
      {children}
    </FactoryDataContext.Provider>
  );
}

export function useFactoryData() {
  const ctx = useContext(FactoryDataContext);
  if (!ctx) {
    throw new Error("useFactoryData must be used within FactoryDataProvider");
  }
  return ctx;
}
