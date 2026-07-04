"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { COLLECTORS, CURRENT_GENERATOR, PRICE_PER_BARREL_OMR } from "@/lib/mock-data";
import { Collector } from "@/lib/types";

type Step = "list" | "confirm" | "done";

function permitBadge(status: Collector["permitStatus"]) {
  switch (status) {
    case "active":
      return { label: "تصريح ساري", className: "bg-brand-50 text-brand-700" };
    case "expiring_soon":
      return { label: "ينتهي قريبًا", className: "bg-amber-50 text-amber-700" };
    case "expired":
      return { label: "منتهي", className: "bg-red-50 text-red-700" };
  }
}

interface ContractWithCollectorProps {
  /** e.g. a branch name — scopes the contract to that branch instead of the whole generator */
  subjectLabel?: string;
  onSigned: (collector: Collector) => void;
}

export function ContractWithCollector({ subjectLabel, onSigned }: ContractWithCollectorProps) {
  const [step, setStep] = useState<Step>("list");
  const [selected, setSelected] = useState<Collector | null>(null);
  const [contractId] = useState(() => `INV-C-${Math.floor(100000 + Math.random() * 900000)}`);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
      {step === "list" && (
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-neutral-900">
              اختر شركة تجميع للتعاقد معها
            </h1>
            <p className="text-sm text-neutral-400">
              {subjectLabel
                ? `العقد سيكون خاصًا بـ ${subjectLabel}`
                : "كل شركات التجميع المسجّلة في المنصة"}
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {COLLECTORS.map((c) => {
              const badge = permitBadge(c.permitStatus);
              const disabled = c.permitStatus === "expired";
              return (
                <button
                  key={c.id}
                  disabled={disabled}
                  onClick={() => {
                    setSelected(c);
                    setStep("confirm");
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-right transition active:scale-[0.99] disabled:opacity-40"
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-neutral-100 text-xl">
                    🚛
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-neutral-900">{c.name}</p>
                    <p className="text-xs text-neutral-400">
                      {c.region} · تقييم {c.rating} · {c.activeVehicles} مركبات
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "confirm" && selected && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="text-center">
            <span className="text-5xl">🤝</span>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              عقد ارتباط مع {selected.name}
            </h2>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">المنشأة</span>
              <span className="font-bold text-neutral-900">{CURRENT_GENERATOR.name}</span>
            </div>
            {subjectLabel && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">الفرع</span>
                <span className="font-bold text-neutral-900">{subjectLabel}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">شركة التجميع</span>
              <span className="font-bold text-neutral-900">{selected.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">السعر الرسمي المعتمد</span>
              <span className="font-bold text-neutral-900">
                {PRICE_PER_BARREL_OMR} ر.ع / 200 لتر
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">مدة العقد</span>
              <span className="font-bold text-neutral-900">سنة واحدة، قابلة للتجديد</span>
            </div>
          </div>

          <button
            onClick={() => {
              onSigned(selected);
              setStep("done");
            }}
            className="mt-auto h-14 rounded-2xl bg-brand-600 text-lg font-bold text-white active:scale-[0.98]"
          >
            توقيع العقد
          </button>
          <button
            onClick={() => setStep("list")}
            className="h-12 rounded-2xl text-sm font-semibold text-neutral-400"
          >
            اختيار شركة أخرى
          </button>
        </div>
      )}

      {step === "done" && selected && (
        <div className="flex flex-1 flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">تم توثيق العقد</h2>
            <p className="text-sm text-neutral-400">رقم العقد {contractId}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <QRCodeSVG value={contractId} size={168} />
          </div>

          <p className="max-w-xs text-sm text-neutral-500">
            {subjectLabel ? (
              <>
                أصبح <span className="font-bold">{subjectLabel}</span> الآن مرتبطًا رسميًا بـ{" "}
                <span className="font-bold">{selected.name}</span> لتجميع الزيوت المستعملة حسب
                السعر الرسمي المعتمد.
              </>
            ) : (
              <>
                أصبحت الآن مرتبطًا رسميًا بـ <span className="font-bold">{selected.name}</span>{" "}
                لتجميع الزيوت المستعملة حسب السعر الرسمي المعتمد.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
