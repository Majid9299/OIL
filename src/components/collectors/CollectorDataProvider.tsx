"use client";

import { createContext, useContext, useState } from "react";
import { VEHICLES } from "@/lib/mock-data";
import { CompanyRegistration, PermitDocument, RoutePoint, Vehicle } from "@/lib/types";

export type CollectorRole = "owner" | "driver";

interface CollectorDataContextValue {
  role: CollectorRole;
  setRole: (role: CollectorRole) => void;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "id">) => void;
  addPermitDocument: (vehicleId: string, document: Omit<PermitDocument, "id">) => void;
  removePermitDocument: (vehicleId: string, documentId: string) => void;
  registration: CompanyRegistration;
  updateRegistration: (data: CompanyRegistration) => void;
  addRegistrationDocument: (document: Omit<PermitDocument, "id">) => void;
  removeRegistrationDocument: (documentId: string) => void;
  coverageWilayats: string[];
  toggleCoverageWilayat: (wilayat: string) => void;
  vehicleRoutes: Record<string, RoutePoint[]>;
  setVehicleRoute: (vehicleId: string, points: RoutePoint[]) => void;
}

const CollectorDataContext = createContext<CollectorDataContextValue | null>(null);

export function CollectorDataProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<CollectorRole>("owner");
  const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);
  const [registration, setRegistration] = useState<CompanyRegistration>({
    companyName: "شركة الخليج لتجميع الزيوت",
    taxNumber: "",
    crNumber: "",
    whatsapp: "",
    email: "",
    documents: [],
  });
  const [coverageWilayats, setCoverageWilayats] = useState<string[]>(["مسقط", "مطرح", "بوشر"]);
  const [vehicleRoutes, setVehicleRoutes] = useState<Record<string, RoutePoint[]>>({});

  function addVehicle(vehicle: Omit<Vehicle, "id">) {
    setVehicles((prev) => [...prev, { ...vehicle, id: `veh-${Date.now()}` }]);
  }

  function addPermitDocument(vehicleId: string, document: Omit<PermitDocument, "id">) {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              permitDocuments: [
                ...v.permitDocuments,
                { ...document, id: `doc-${Date.now()}` },
              ],
            }
          : v
      )
    );
  }

  function removePermitDocument(vehicleId: string, documentId: string) {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, permitDocuments: v.permitDocuments.filter((d) => d.id !== documentId) }
          : v
      )
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

  function toggleCoverageWilayat(wilayat: string) {
    setCoverageWilayats((prev) =>
      prev.includes(wilayat) ? prev.filter((w) => w !== wilayat) : [...prev, wilayat]
    );
  }

  function setVehicleRoute(vehicleId: string, points: RoutePoint[]) {
    setVehicleRoutes((prev) => ({ ...prev, [vehicleId]: points }));
  }

  return (
    <CollectorDataContext.Provider
      value={{
        role,
        setRole,
        vehicles,
        addVehicle,
        addPermitDocument,
        removePermitDocument,
        registration,
        updateRegistration,
        addRegistrationDocument,
        removeRegistrationDocument,
        coverageWilayats,
        toggleCoverageWilayat,
        vehicleRoutes,
        setVehicleRoute,
      }}
    >
      {children}
    </CollectorDataContext.Provider>
  );
}

export function useCollectorData() {
  const ctx = useContext(CollectorDataContext);
  if (!ctx) {
    throw new Error("useCollectorData must be used within CollectorDataProvider");
  }
  return ctx;
}
