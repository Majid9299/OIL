"use client";

import { PickupRequest } from "@/lib/types";
import { PRICE_PER_BARREL_OMR, STANDARD_BARREL_LITERS } from "@/lib/mock-data";
import { calculateStandardDeal } from "@/lib/commission";

interface PickupRequestCardProps {
  request: PickupRequest;
  onComplete: () => void;
}

function roundOMR(value: number) {
  return Math.round(value * 100) / 100;
}

export function PickupRequestCard({ request, onComplete }: PickupRequestCardProps) {
  const isPending = request.status === "pending";
  const heldAmount = calculateStandardDeal(
    PRICE_PER_BARREL_OMR,
    request.totalLiters / STANDARD_BARREL_LITERS
  ).buyerTotal;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-neutral-100 text-xl">
        🛢️
      </div>
      <div className="flex-1">
        <p className="font-bold text-neutral-900">{request.generatorName}</p>
        <p className="text-xs text-neutral-400">
          {request.branchName} · {request.totalLiters} لتر · {request.totalOMR} ر.ع
        </p>
        {isPending && (
          <p className="mt-1 text-[11px] font-semibold text-amber-700">
            🔒 {roundOMR(heldAmount)} ر.ع محتجز لحين التسليم والاستلام
          </p>
        )}
      </div>
      {isPending ? (
        <button
          onClick={onComplete}
          className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          تم التسليم والاستلام ✅
        </button>
      ) : (
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-500">
          مكتمل
        </span>
      )}
    </div>
  );
}
