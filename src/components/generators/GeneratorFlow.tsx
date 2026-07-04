"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CONTAINER_TYPES,
  CURRENT_GENERATOR,
  PRICE_PER_BARREL_OMR,
  PRICE_PER_LITER_OMR,
  STANDARD_BARREL_LITERS,
} from "@/lib/mock-data";
import { ContainerCard } from "./ContainerCard";
import { useGeneratorData } from "./GeneratorDataProvider";
import { usePickupRequests } from "@/components/shared/PickupRequestsProvider";
import { useWallet } from "@/components/shared/WalletProvider";
import { calculateStandardDeal } from "@/lib/commission";

type Step = "containers" | "contract";

function roundOMR(value: number) {
  return Math.round(value * 100) / 100;
}

export function GeneratorFlow() {
  const { contractedCollector } = useGeneratorData();
  const { addRequest } = usePickupRequests();
  const { freeze } = useWallet();
  const [step, setStep] = useState<Step>("containers");
  const [containerCounts, setContainerCounts] = useState<Record<string, number>>({});
  const [customLitersInput, setCustomLitersInput] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const customLiters = Math.max(0, Number(customLitersInput) || 0);

  const filledContainers = CONTAINER_TYPES.map((type) => ({
    type,
    count: containerCounts[type.id] ?? 0,
  })).filter((c) => c.count > 0);

  const containerLiters = filledContainers.reduce(
    (sum, c) => sum + c.count * c.type.literCapacity,
    0
  );
  const totalLiters = containerLiters + customLiters;
  const totalOMR = roundOMR(totalLiters * PRICE_PER_LITER_OMR);

  function updateCount(typeId: string, delta: number) {
    setContainerCounts((prev) => {
      const next = Math.max(0, (prev[typeId] ?? 0) + delta);
      return { ...prev, [typeId]: next };
    });
  }

  function reset() {
    setStep("containers");
    setContainerCounts({});
    setCustomLitersInput("");
    setRequestId(null);
  }

  function notifyCollector() {
    if (!contractedCollector) return;
    const id = addRequest({
      collectorId: contractedCollector.id,
      generatorName: CURRENT_GENERATOR.name,
      branchName: CURRENT_GENERATOR.branch,
      wilayat: CURRENT_GENERATOR.wilayat,
      lat: CURRENT_GENERATOR.lat,
      lng: CURRENT_GENERATOR.lng,
      totalLiters,
      totalOMR,
    });
    // يُحتجز المبلغ من محفظة المجمّع (المشتري) عند إتمام البيع، شاملًا عمولة إنفير والضريبة —
    // يُفرَج عنه لصالح المولّد فقط بعد تسليم الزيت واستلام المجمّع له فعليًا (زر "تم الاستلام")
    const deal = calculateStandardDeal(PRICE_PER_BARREL_OMR, totalLiters / STANDARD_BARREL_LITERS);
    freeze(
      "collector",
      deal.buyerTotal,
      `تجميد مبلغ صفقة مع ${CURRENT_GENERATOR.name} (شامل العمولة والضريبة)`
    );
    setRequestId(id);
    setStep("contract");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
      <div className="mb-6">
        <p className="text-xs font-medium text-neutral-400">مرحبًا</p>
        <h1 className="text-lg font-extrabold text-neutral-900">{CURRENT_GENERATOR.name}</h1>
        <p className="text-xs text-neutral-400">{CURRENT_GENERATOR.branch}</p>
      </div>

      {step === "containers" && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-neutral-900">
              اضغط على الحاوية لما تمتلئ
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              اختر نوع الحاوية وسجّل كل وحدة ممتلئة عندك
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {CONTAINER_TYPES.map((type) => (
              <ContainerCard
                key={type.id}
                icon={type.icon}
                label={type.label}
                literCapacity={type.literCapacity}
                count={containerCounts[type.id] ?? 0}
                onIncrement={() => updateCount(type.id, 1)}
                onDecrement={() => updateCount(type.id, -1)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <label htmlFor="custom-liters" className="flex-1 text-sm text-neutral-500">
              أو اكتب الكمية مباشرة (لتر)
            </label>
            <input
              id="custom-liters"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={customLitersInput}
              onChange={(e) => setCustomLitersInput(e.target.value)}
              className="w-24 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-center text-lg font-bold text-neutral-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-brand-50 p-4 text-center">
            <p className="text-xs text-brand-700">إجمالي اللترات المسجّلة</p>
            <p className="text-2xl font-extrabold text-brand-700">{totalLiters} لتر</p>
            <p className="text-[11px] text-brand-600">
              المبلغ المتوقع {totalOMR} ر.ع (حسب السعر الرسمي {PRICE_PER_LITER_OMR * 200}{" "}
              ر.ع لكل 200 لتر)
            </p>
          </div>

          {contractedCollector ? (
            <button
              onClick={notifyCollector}
              disabled={totalLiters === 0}
              className="h-14 rounded-2xl bg-brand-600 text-lg font-bold text-white transition active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              تنبيه المجمّع
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center">
              <p className="text-sm text-neutral-500">ما اخترت مجمّع بعد</p>
              <Link
                href="/generators/contract"
                className="mt-2 inline-block text-sm font-bold text-brand-700"
              >
                اختيار المجمّع أولًا ←
              </Link>
            </div>
          )}
        </div>
      )}

      {step === "contract" && contractedCollector && requestId && (
        <div className="flex flex-1 flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">تم إرسال التنبيه للمجمّع</h2>
            <p className="text-sm text-neutral-400">
              بانتظار وصول {contractedCollector.name} للتحصيل
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <QRCodeSVG value={requestId} size={168} />
          </div>

          <div className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-right text-sm">
            <div className="flex justify-between py-1">
              <span className="text-neutral-400">رقم الطلب</span>
              <span className="font-semibold">{requestId}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-400">المجمّع</span>
              <span className="font-semibold">{contractedCollector.name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-400">الكمية</span>
              <span className="font-semibold">{totalLiters} لتر</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-400">المبلغ</span>
              <span className="font-semibold">{totalOMR} ر.ع</span>
            </div>
          </div>

          <button
            onClick={reset}
            className="mt-auto h-14 w-full rounded-2xl bg-neutral-900 text-lg font-bold text-white active:scale-[0.98]"
          >
            تم
          </button>
        </div>
      )}
    </div>
  );
}
