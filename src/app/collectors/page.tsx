"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { InvareMark } from "@/components/InvareMark";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useLanguage } from "@/components/shared/LanguageProvider";
import { CollectorRoleSwitcher } from "@/components/collectors/CollectorRoleSwitcher";
import { CollectorTopActions } from "@/components/collectors/CollectorTopActions";
import { PickupRequestCard } from "@/components/collectors/PickupRequestCard";
import { useCollectorData } from "@/components/collectors/CollectorDataProvider";
import { usePickupRequests } from "@/components/shared/PickupRequestsProvider";
import { useWallet } from "@/components/shared/WalletProvider";
import { CURRENT_COLLECTOR, PRICE_PER_BARREL_OMR, STANDARD_BARREL_LITERS } from "@/lib/mock-data";
import { PickupRequest } from "@/lib/types";
import { calculateStandardDeal } from "@/lib/commission";

const RouteMap = dynamic(
  () => import("@/components/collectors/RouteMap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-neutral-200 text-sm text-neutral-400">
        جارِ تحميل الخريطة…
      </div>
    ),
  }
);

function permitBadge(status: typeof CURRENT_COLLECTOR.permitStatus) {
  switch (status) {
    case "active":
      return { label: "تصريح ساري", className: "bg-brand-50 text-brand-700" };
    case "expiring_soon":
      return { label: "ينتهي قريبًا", className: "bg-amber-50 text-amber-700" };
    case "expired":
      return { label: "منتهي", className: "bg-red-50 text-red-700" };
  }
}

export default function CollectorsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { vehicles } = useCollectorData();
  const { requests, completeRequest } = usePickupRequests();
  const { releaseFrozenSplit } = useWallet();

  // المبلغ يكون محتجزًا من محفظة المجمّع منذ لحظة البيع (تنبيه المجمّع)، شاملًا عمولة إنفير
  // والضريبة — هذا الزر هو تأكيد التسليم والاستلام الفعلي، فيُفرَج عن المجمَّد ويُوزَّع:
  // صافي للمولّد + عمولة إنفير لمحفظة المنصة
  function handleComplete(request: PickupRequest) {
    completeRequest(request.id);
    const deal = calculateStandardDeal(
      PRICE_PER_BARREL_OMR,
      request.totalLiters / STANDARD_BARREL_LITERS
    );
    releaseFrozenSplit(
      "collector",
      "generator",
      deal.buyerTotal,
      deal.sellerNet,
      deal.invareProfit,
      `تسليم واستلام مؤكَّد — ${request.generatorName}`,
      `بيع لـ ${CURRENT_COLLECTOR.name}`
    );
  }

  const myRequests = requests.filter((r) => r.collectorId === CURRENT_COLLECTOR.id);
  const pending = myRequests.filter((r) => r.status === "pending");
  const completed = myRequests.filter((r) => r.status === "completed");
  const inventoryLiters = completed.reduce((sum, r) => sum + r.totalLiters, 0);
  const activeVehicles = vehicles.filter((v) => v.active).length;
  const badge = permitBadge(CURRENT_COLLECTOR.permitStatus);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/" className="text-sm font-semibold text-neutral-400">
          {t("common.home")}
        </Link>
        <div className="flex items-center gap-2">
          <InvareMark size={30} />
          <LanguageToggle />
        </div>
      </div>
      <PortalSwitcher />
      <div className="flex justify-center border-b border-neutral-200 bg-white px-5 py-2.5">
        <CollectorRoleSwitcher />
      </div>
      <CollectorTopActions />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
        <div>
          <p className="text-xs font-medium text-neutral-400">مرحبًا</p>
          <h1 className="text-lg font-extrabold text-neutral-900">{CURRENT_COLLECTOR.name}</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-brand-50 p-3 text-center">
            <p className="text-[11px] text-brand-700">المخزون الحالي</p>
            <p className="text-lg font-extrabold text-brand-700">{inventoryLiters}L</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 p-3 text-center">
            <p className="text-[11px] text-neutral-500">مركبات نشطة</p>
            <p className="text-lg font-extrabold text-neutral-800">{activeVehicles}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#fafafa" }}>
            <p className="mb-1 text-[11px] text-neutral-400">التصريح</p>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-neutral-700">
            طلبات السحب الواردة ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
              ما فيه طلبات سحب حاليًا
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((r) => (
                <PickupRequestCard
                  key={r.id}
                  request={r}
                  onComplete={() => handleComplete(r)}
                />
              ))}
            </div>
          )}
        </div>

        {pending.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-700">الكميات على الخريطة</h2>
              <Link href="/collectors/fleet" className="text-xs font-semibold text-brand-700">
                اختر مركبة لبناء مسارها ←
              </Link>
            </div>
            <RouteMap
              pendingPoints={pending.map((r) => ({
                id: r.id,
                label: r.generatorName,
                sub: `${r.wilayat} · ${r.totalLiters} لتر`,
                lat: r.lat,
                lng: r.lng,
              }))}
              routePoints={[]}
              onPendingClick={() => router.push("/collectors/fleet")}
              heightClassName="h-56"
            />
            <p className="mt-2 text-[11px] text-neutral-400">
              اضغط على أي نقطة، ثم اختر المركبة اللي بتسحب هذي الكمية من صفحة الأسطول
            </p>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-neutral-700">
              طلبات مكتملة ({completed.length})
            </h2>
            <div className="flex flex-col gap-3">
              {completed.map((r) => (
                <PickupRequestCard key={r.id} request={r} onComplete={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
