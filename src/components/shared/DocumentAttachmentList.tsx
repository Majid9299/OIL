"use client";

import { useState } from "react";
import { getDocumentPermitStatus, TransportPermitStatus } from "@/lib/mock-data";
import { PermitDocument } from "@/lib/types";

function docBadgeInfo(status: Exclude<TransportPermitStatus, "missing">) {
  switch (status) {
    case "active":
      return { label: "ساري", className: "bg-brand-50 text-brand-700" };
    case "expiring_soon":
      return { label: "ينتهي قريبًا", className: "bg-amber-50 text-amber-700" };
    case "expired":
      return { label: "منتهي", className: "bg-red-50 text-red-700" };
  }
}

interface DocumentAttachmentListProps {
  documents: PermitDocument[];
  onAdd: (name: string, expiresAt: string) => void;
  onRemove: (documentId: string) => void;
  addButtonLabel?: string;
}

export function DocumentAttachmentList({
  documents,
  onAdd,
  onRemove,
  addButtonLabel = "+ إضافة مستند",
}: DocumentAttachmentListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  function submit() {
    if (!name.trim() || !expiresAt) return;
    onAdd(name.trim(), expiresAt);
    setName("");
    setExpiresAt("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {documents.map((doc) => {
            const badge = docBadgeInfo(getDocumentPermitStatus(doc.expiresAt));
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
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <button
                  onClick={() => onRemove(doc.id)}
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

      {showForm ? (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المستند"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const picked = e.target.files?.[0]?.name;
              if (picked && !name.trim()) setName(picked);
            }}
            className="text-xs text-neutral-500 file:ml-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-neutral-700"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!name.trim() || !expiresAt}
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
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-right text-xs font-semibold text-brand-700"
        >
          {addButtonLabel}
        </button>
      )}
    </div>
  );
}
