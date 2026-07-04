"use client";

import { useState } from "react";
import { BRANCHES, OIL_BATCHES } from "@/lib/mock-data";
import { Collector } from "@/lib/types";

interface CompanyCardProps {
  company: Collector;
  expanded: boolean;
  onToggle: () => void;
}

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

const batchStatusLabel: Record<string, string> = {
  offered: "بانتظار القرار",
  accepted: "مقبولة",
  rejected: "مرفوضة",
  objected: "قيد الاعتراض",
};

export function CompanyCard({ company, expanded, onToggle }: CompanyCardProps) {
  const [showAll, setShowAll] = useState(false);
  const badge = permitBadge(company.permitStatus);
  const linkedBranches = BRANCHES.filter((b) => b.assignedCollectorId === company.id);
  const batches = OIL_BATCHES.filter((b) => b.collectorId === company.id);
  const visibleBatches = showAll ? batches : batches.slice(0, 3);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <button onClick={onToggle} className="flex w-full items-center gap-3 text-right">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-neutral-100 text-lg">
          🏢
        </div>
        <div className="flex-1">
          <p className="font-bold text-neutral-900">{company.name}</p>
          <p className="text-xs text-neutral-400">
            {company.wilayat} · سجل تجاري {company.crNumber} · تقييم {company.rating}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badge.className}`}>
          {badge.label}
        </span>
        <span className="text-neutral-300">{expanded ? "▲" : "▼"}</span>
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600">
          زيت طبخ مستعمل
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600">
          {company.activeVehicles} مركبات نشطة
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600">
          {company.deliveredTonsToDate} طن مُسلَّم
        </span>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4 border-t border-neutral-100 pt-4">
          <div>
            <p className="mb-2 text-xs font-bold text-neutral-500">
              انتهاء التصريح: {company.permitExpiresAt}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-neutral-500">
              فروع المولّدين المرتبطة ({linkedBranches.length})
            </p>
            {linkedBranches.length === 0 ? (
              <p className="text-xs text-neutral-400">لا يوجد فروع مرتبطة حاليًا</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {linkedBranches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-neutral-700">{b.name}</span>
                    <span className="text-neutral-400">{b.totalLitersToDate} لتر إجمالي</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-neutral-500">
              سلسلة التوريد إلى المصانع ({batches.length})
            </p>
            {batches.length === 0 ? (
              <p className="text-xs text-neutral-400">لا توجد دفعات مسجّلة حاليًا</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {visibleBatches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-neutral-700">
                      {b.tons} طن · {b.totalOMR} ر.ع
                    </span>
                    <span className="text-neutral-400">{batchStatusLabel[b.status]}</span>
                  </div>
                ))}
                {batches.length > 3 && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="self-start text-[11px] font-semibold text-brand-700"
                  >
                    {showAll ? "عرض أقل" : `عرض الكل (${batches.length})`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
