"use client";

import { createContext, useContext, useState } from "react";
import { BRANCHES } from "@/lib/mock-data";
import { AuthorizedUser, Branch, Collector, CompanyRegistration, PermitDocument } from "@/lib/types";

export type GeneratorRole = "owner" | "authorized";

interface GeneratorDataContextValue {
  branches: Branch[];
  addAuthorizedUser: (branchId: string, user: Omit<AuthorizedUser, "id">) => void;
  assignCollectorToBranch: (branchId: string, collectorId: string) => void;
  registration: CompanyRegistration;
  updateRegistration: (data: CompanyRegistration) => void;
  addRegistrationDocument: (document: Omit<PermitDocument, "id">) => void;
  removeRegistrationDocument: (documentId: string) => void;
  contractedCollector: Collector | null;
  setContractedCollector: (collector: Collector) => void;
  role: GeneratorRole;
  setRole: (role: GeneratorRole) => void;
}

const GeneratorDataContext = createContext<GeneratorDataContextValue | null>(null);

export function GeneratorDataProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(BRANCHES);
  const [registration, setRegistration] = useState<CompanyRegistration>({
    companyName: "مطعم الواحة الذهبية",
    taxNumber: "",
    crNumber: "",
    whatsapp: "",
    email: "",
    documents: [],
  });
  const [contractedCollector, setContractedCollector] = useState<Collector | null>(null);
  const [role, setRole] = useState<GeneratorRole>("owner");

  function addAuthorizedUser(branchId: string, user: Omit<AuthorizedUser, "id">) {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === branchId
          ? {
              ...b,
              authorizedUsers: [
                ...b.authorizedUsers,
                { ...user, id: `au-${Date.now()}` },
              ],
            }
          : b
      )
    );
  }

  function assignCollectorToBranch(branchId: string, collectorId: string) {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, assignedCollectorId: collectorId } : b))
    );
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
    <GeneratorDataContext.Provider
      value={{
        branches,
        addAuthorizedUser,
        assignCollectorToBranch,
        registration,
        updateRegistration,
        addRegistrationDocument,
        removeRegistrationDocument,
        contractedCollector,
        setContractedCollector,
        role,
        setRole,
      }}
    >
      {children}
    </GeneratorDataContext.Provider>
  );
}

export function useGeneratorData() {
  const ctx = useContext(GeneratorDataContext);
  if (!ctx) {
    throw new Error("useGeneratorData must be used within GeneratorDataProvider");
  }
  return ctx;
}
