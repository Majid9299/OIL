"use client";

import { useState } from "react";
import Link from "next/link";
import { getDocumentPermitStatus, getVehiclePermitStatus, TransportPermitStatus } from "@/lib/mock-data";
import { PermitDocument, Vehicle } from "@/lib/types";

function permitBadgeInfo(status: TransportPermitStatus) {
  switch (status) {
    case "active":
      return { label: "تصريح ساري", className: "bg-brand-50 text-brand-700" };
    case "expiring_soon":
      return { label: "ينتهي قريبًا", className: "bg-amber-50 text-amber-700" };
    case "expired":
      return { label: "منتهي", className: "bg-red-50 text-red-700" };
    case "missing":
      return { label: "بدون تصريح", className: "bg-neutral-100 text-neutral-400" };
  }
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onAddDocument: (name: string, expiresAt: string) => void;
  onRemoveDocument: (documentId: string) => void;
  routePointsCount?: number;
}

export function VehicleCard({
  vehicle,
  onAddDocument,
  onRemoveDocument,
  routePointsCount = 0,
}: VehicleCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const overallStatus = getVehiclePermitStatus(vehicle.permitDocuments);
  const overallBadge = permitBadgeInfo(overallStatus);

  function submit() {
    if (!documentName.trim() || !expiresAt) return;
    onAddDocument(documentName.trim(), expiresAt);
    setDocumentName("");
    setExpiresAt("");
    setShowForm(false);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-neutral-100 text-xl">
          🚚
        </div>
        <div className="flex-1">
          <p className="font-bold text-neutral-900">{vehicle.driverName}</p>
          <p className="text-xs text-neutral-400" dir="ltr">
            {vehicle.plateNumber} · {vehicle.driverWhatsapp}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            vehicle.active ? "bg-brand-50 text-brand-700" : "bg-neutral-100 text-neutral-400"
          }`}
        >
          {vehicle.active ? "نشطة" : "متوقفة"}
        </span>
      </div>

      <Link
        href={`/collectors/route/${vehicle.id}`}
        className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-xs font-semibold text-brand-700"
      >
        <span>🗺️ مسار هذي المركبة</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-neutral-500">
          {routePointsCount > 0 ? `${routePointsCount} نقطة` : "بدون مسار"}
        </span>
      </Link>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${overallBadge.className}`}
            >
              {overallBadge.label}
            </span>
            <span className="text-xs text-neutral-400">
              مستندات نقل الزيوت ({vehicle.permitDocuments.length})
            </span>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-xs font-semibold text-brand-700"
          >
            + إضافة مستند
          </button>
        </div>

        {vehicle.permitDocuments.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {vehicle.permitDocuments.map((doc: PermitDocument) => {
              const docBadge = permitBadgeInfo(getDocumentPermitStatus(doc.expiresAt));
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-neutral-700">📎 {doc.name}</p>
                    <p className="text-[11px] text-neutral-400">ينتهي في {doc.expiresAt}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${docBadge.className}`}
                  >
                    {docBadge.label}
                  </span>
                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="mr-1 text-xs font-bold text-neutral-300 hover:text-red-500"
                    aria-label={`حذف ${doc.name}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-500">اسم المستند</label>
            <input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="مثال: تصريح نقل زيوت الطبخ المستعملة"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <label className="text-xs font-semibold text-neutral-500">تاريخ الانتهاء</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <label className="text-xs font-semibold text-neutral-500">ملف المستند (اختياري)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => {
                const picked = e.target.files?.[0]?.name;
                if (picked && !documentName.trim()) setDocumentName(picked);
              }}
              className="text-xs text-neutral-500 file:ml-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-neutral-700"
            />
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={!documentName.trim() || !expiresAt}
                className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-bold text-white active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                حفظ المستند
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl px-3 text-sm font-semibold text-neutral-400"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
