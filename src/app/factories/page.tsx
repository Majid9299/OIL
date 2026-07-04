"use client";

import Link from "next/link";
import { InvareMark } from "@/components/InvareMark";
import { FactoryTopActions } from "@/components/factories/FactoryTopActions";
import { BatchCard } from "@/components/factories/BatchCard";
import { useFactoryData } from "@/components/factories/FactoryDataProvider";
import { useWallet } from "@/components/shared/WalletProvider";
import { COLLECTORS, CURRENT_FACTORY, PRICE_PER_TON_OMR } from "@/lib/mock-data";
import { OilBatch } from "@/lib/types";
import { calculateStandardDeal } from "@/lib/commission";

export default function FactoriesPage() {
  const { batches, acceptBatch, rejectBatch, markObjected } = useFactoryData();
  const { freeze, releaseFrozenSplit } = useWallet();

  // "شراء" = تحديد الكمية الفعلية ← يُحتجز المبلغ فورًا عند البيع (شامل عمولة إنفير
  // والضريبة)، ثم يُفرَج عنه ويُوزَّع: صافي للمجمّع + عمولة إنفير لمحفظة المنصة، بمجرّد
  // تأكيد التسليم والاستلام (نفس مربّع الشراء هو نقطة الاستلام هنا)
  function handleAccept(batch: OilBatch, quantityTons: number) {
    const deal = calculateStandardDeal(batch.pricePerTonOMR, quantityTons);
    const collectorName =
      COLLECTORS.find((c) => c.id === batch.collectorId)?.name ?? "المجمّع";

    acceptBatch(batch.id, quantityTons);
    freeze(
      "factory",
      deal.buyerTotal,
      `احتجاز مبلغ شراء ${quantityTons} طن من ${collectorName} (شامل العمولة والضريبة)`
    );
    releaseFrozenSplit(
      "factory",
      "collector",
      deal.buyerTotal,
      deal.sellerNet,
      deal.invareProfit,
      `استلام مؤكَّد — ${quantityTons} طن من ${collectorName}`,
      `بيع ${quantityTons} طن لـ ${CURRENT_FACTORY.name}`
    );
  }

  // الرفض = الصفقة لم تتم — لا يوجد مبلغ محتجز بعد لأنه لم يُحدَّد سعر شراء
  function handleReject(batch: OilBatch) {
    rejectBatch(batch.id);
  }

  const offered = batches.filter((b) => b.status === "offered");
  const decided = batches.filter((b) => b.status !== "offered");
  const totalTons = batches
    .filter((b) => b.status === "accepted")
    .reduce((sum, b) => sum + b.tons, 0);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/" className="text-sm font-semibold text-neutral-400">
          ← الرئيسية
        </Link>
        <InvareMark size={24} />
      </div>
      <FactoryTopActions />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
        <div>
          <p className="text-xs font-medium text-neutral-400">مرحبًا</p>
          <h1 className="text-lg font-extrabold text-neutral-900">{CURRENT_FACTORY.name}</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-brand-50 p-3 text-center">
            <p className="text-[11px] text-brand-700">مشتريات مؤكدة</p>
            <p className="text-lg font-extrabold text-brand-700">{totalTons} طن</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 p-3 text-center">
            <p className="text-[11px] text-neutral-500">بانتظار القرار</p>
            <p className="text-lg font-extrabold text-neutral-800">{offered.length}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#fafafa" }}>
            <p className="mb-1 text-[11px] text-neutral-400">سعر البيع الرسمي</p>
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600">
              {PRICE_PER_TON_OMR} ر.ع/طن
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-3 text-center text-xs text-neutral-400">
          حياد كامل في مصدر المادة — هوية المجمّع لا تظهر إلا بعد قبول الدفعة أو الاعتراض عليها، ضمن
          نظام سحب بترتيب تناوب عادل بين المجمّعين المؤهّلين
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-neutral-700">
            دفعات ضمن السحب العادل ({offered.length})
          </h2>
          {offered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
              ما فيه دفعات معروضة حاليًا
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {offered.map((b) => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  onAccept={(qty) => handleAccept(b, qty)}
                  onReject={() => handleReject(b)}
                  onObjected={() => markObjected(b.id)}
                />
              ))}
            </div>
          )}
        </div>

        {decided.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-neutral-700">
              دفعات سابقة ({decided.length})
            </h2>
            <div className="flex flex-col gap-3">
              {decided.map((b) => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  onAccept={() => {}}
                  onReject={() => {}}
                  onObjected={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
