"use client";

import { useState } from "react";
import { PermitDocument } from "@/lib/types";
import { useCollectorData } from "./CollectorDataProvider";
import { VehicleCard } from "./VehicleCard";

export function FleetManager() {
  const { vehicles, addVehicle, addPermitDocument, removePermitDocument, vehicleRoutes } =
    useCollectorData();
  const [showForm, setShowForm] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverWhatsapp, setDriverWhatsapp] = useState("");
  const [pendingDocuments, setPendingDocuments] = useState<Omit<PermitDocument, "id">[]>([]);
  const [docName, setDocName] = useState("");
  const [docExpiresAt, setDocExpiresAt] = useState("");

  function addPendingDocument() {
    if (!docName.trim() || !docExpiresAt) return;
    setPendingDocuments((prev) => [...prev, { name: docName.trim(), expiresAt: docExpiresAt }]);
    setDocName("");
    setDocExpiresAt("");
  }

  function submit() {
    if (!plateNumber.trim() || !driverName.trim() || !driverWhatsapp.trim()) return;
    addVehicle({
      plateNumber: plateNumber.trim(),
      driverName: driverName.trim(),
      driverWhatsapp: driverWhatsapp.trim(),
      active: true,
      permitDocuments: pendingDocuments.map((d, i) => ({
        ...d,
        id: `doc-${Date.now()}-${i}`,
      })),
    });
    setPlateNumber("");
    setDriverName("");
    setDriverWhatsapp("");
    setPendingDocuments([]);
    setShowForm(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-8">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">الأسطول</h1>
        <p className="text-sm text-neutral-400">مركبات وسائقو شركتك وتصاريح نقل الزيوت</p>
      </div>

      <div className="flex flex-col gap-3">
        {vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            onAddDocument={(name, expiresAt) => addPermitDocument(v.id, { name, expiresAt })}
            onRemoveDocument={(documentId) => removePermitDocument(v.id, documentId)}
            routePointsCount={vehicleRoutes[v.id]?.length ?? 0}
          />
        ))}
      </div>

      {showForm ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="اسم السائق"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="رقم اللوحة"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            value={driverWhatsapp}
            onChange={(e) => setDriverWhatsapp(e.target.value)}
            placeholder="رقم الواتساب (+968 ...)"
            dir="ltr"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />

          <hr className="my-1 border-neutral-100" />
          <label className="text-xs font-semibold text-neutral-500">
            مستندات نقل الزيوت (اختياري — يمكن إضافة أكثر من مستند)
          </label>

          {pendingDocuments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {pendingDocuments.map((d, i) => (
                <div
                  key={`${d.name}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-neutral-700">
                    📎 {d.name} · ينتهي {d.expiresAt}
                  </p>
                  <button
                    onClick={() =>
                      setPendingDocuments((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-xs font-bold text-neutral-300 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="اسم المستند"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="date"
            value={docExpiresAt}
            onChange={(e) => setDocExpiresAt(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={addPendingDocument}
            disabled={!docName.trim() || !docExpiresAt}
            className="rounded-xl border border-dashed border-neutral-300 py-2 text-xs font-bold text-brand-700 disabled:opacity-40"
          >
            + إضافة مستند آخر للقائمة
          </button>

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-bold text-white active:scale-[0.98]"
            >
              إضافة المركبة
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl px-3 text-sm font-semibold text-neutral-400"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="h-12 rounded-2xl border border-dashed border-neutral-300 text-sm font-bold text-brand-700"
        >
          + إضافة مركبة وسائق
        </button>
      )}
    </div>
  );
}
