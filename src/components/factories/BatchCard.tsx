"use client";

import { useState } from "react";
import { COLLECTORS, CURRENT_FACTORY } from "@/lib/mock-data";
import { OilBatch } from "@/lib/types";
import { useObjections } from "@/components/shared/ObjectionsProvider";
import { calculateStandardDeal } from "@/lib/commission";

interface BatchCardProps {
  batch: OilBatch;
  onAccept: (quantityTons: number) => void;
  onReject: () => void;
  onObjected: () => void;
}

function statusBadge(status: OilBatch["status"]) {
  switch (status) {
    case "offered":
      return { label: "بانتظار القرار", className: "bg-neutral-100 text-neutral-500" };
    case "accepted":
      return { label: "مقبولة", className: "bg-brand-50 text-brand-700" };
    case "rejected":
      return { label: "مرفوضة", className: "bg-neutral-100 text-neutral-400" };
    case "objected":
      return { label: "قيد الاعتراض", className: "bg-amber-50 text-amber-700" };
  }
}

export function BatchCard({ batch, onAccept, onReject, onObjected }: BatchCardProps) {
  const { addObjection } = useObjections();
  const [showObjection, setShowObjection] = useState(false);
  const [note, setNote] = useState("");
  const [labReportName, setLabReportName] = useState("");
  const [showPurchase, setShowPurchase] = useState(false);
  const [quantityInput, setQuantityInput] = useState(String(batch.tons));

  const badge = statusBadge(batch.status);
  const revealed = batch.status === "accepted" || batch.status === "objected";
  const collector = revealed ? COLLECTORS.find((c) => c.id === batch.collectorId) : null;

  const quantity = Math.min(Math.max(0, Number(quantityInput) || 0), batch.tons);
  const deal = calculateStandardDeal(batch.pricePerTonOMR, quantity);

  function confirmPurchase() {
    if (quantity <= 0) return;
    onAccept(quantity);
    setShowPurchase(false);
  }

  function submitObjection() {
    if (!note.trim()) return;
    addObjection({
      batchId: batch.id,
      factoryName: CURRENT_FACTORY.name,
      note: note.trim(),
      labReportName: labReportName.trim() || null,
    });
    onObjected();
    setShowObjection(false);
    setNote("");
    setLabReportName("");
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-neutral-100 text-xl">
          🛢️
        </div>
        <div className="flex-1">
          <p className="font-bold text-neutral-900">
            {collector ? collector.name : `مجمّع مرخّص — الدور ${batch.rotationSeq}/${batch.rotationTotal}`}
          </p>
          <p className="text-xs text-neutral-400">
            {batch.tons} طن · {batch.totalOMR} ر.ع · {batch.pricePerTonOMR} ر.ع/طن
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {batch.status === "offered" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowPurchase((v) => !v)}
            className="flex-1 rounded-xl bg-brand-600 py-2 text-xs font-bold text-white active:scale-95"
          >
            شراء 🛒
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-xl bg-neutral-100 py-2 text-xs font-bold text-neutral-600 active:scale-95"
          >
            رفض
          </button>
          <button
            onClick={() => setShowObjection((v) => !v)}
            className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-700 active:scale-95"
          >
            تقديم اعتراض 🧪
          </button>
        </div>
      )}

      {showPurchase && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-bold text-neutral-600">تحديد الكمية المطلوب شراؤها</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={batch.tons}
              step={0.1}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              من أصل {batch.tons} طن
            </span>
          </div>
          <div className="rounded-xl bg-white p-3 text-xs text-neutral-600">
            <div className="flex justify-between py-0.5">
              <span>السعر</span>
              <span>{batch.pricePerTonOMR} ر.ع/طن</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>سعر الكمية</span>
              <span>{deal.basePrice} ر.ع</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>ضريبة القيمة المضافة</span>
              <span>{deal.vatOnBase} ر.ع</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>عمولة إنفير + ضريبتها</span>
              <span>{Math.round((deal.buyerCommission + deal.vatOnBuyerComm) * 100) / 100} ر.ع</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-neutral-100 pt-1 font-bold text-neutral-800">
              <span>المبلغ الإجمالي (يُحتجز لحين التسليم والاستلام)</span>
              <span>{deal.buyerTotal} ر.ع</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmPurchase}
              disabled={quantity <= 0}
              className="flex-1 rounded-xl bg-brand-600 py-2 text-xs font-bold text-white active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              تأكيد الشراء
            </button>
            <button
              onClick={() => setShowPurchase(false)}
              className="rounded-xl px-3 text-xs font-semibold text-neutral-400"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {showObjection && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="سبب الاعتراض ونتيجة الفحص المخبري"
            className="min-h-16 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const picked = e.target.files?.[0]?.name;
              if (picked) setLabReportName(picked);
            }}
            className="text-xs text-neutral-500 file:ml-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-neutral-700"
          />
          {labReportName && <p className="text-[11px] text-neutral-400">📎 {labReportName}</p>}
          <div className="flex gap-2">
            <button
              onClick={submitObjection}
              disabled={!note.trim()}
              className="flex-1 rounded-xl bg-amber-600 py-2 text-xs font-bold text-white active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              إرسال الاعتراض
            </button>
            <button
              onClick={() => setShowObjection(false)}
              className="rounded-xl px-3 text-xs font-semibold text-neutral-400"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
