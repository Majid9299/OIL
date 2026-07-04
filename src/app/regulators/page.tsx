"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { InvareMark } from "@/components/InvareMark";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useLanguage } from "@/components/shared/LanguageProvider";
import { CompanyCard } from "@/components/regulators/CompanyCard";
import { useObjections } from "@/components/shared/ObjectionsProvider";
import { usePickupRequests } from "@/components/shared/PickupRequestsProvider";
import {
  CARBON_AVOIDED_KG_PER_TON,
  COLLECTORS,
  OMAN_GOVERNORATES,
  WILAYAT_COORDS,
} from "@/lib/mock-data";
import { PermitStatus } from "@/lib/types";

const RouteMap = dynamic(
  () => import("@/components/collectors/RouteMap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-neutral-200 text-sm text-neutral-400">
        جارِ تحميل الخريطة…
      </div>
    ),
  }
);

const PERMIT_LABELS: Record<PermitStatus, string> = {
  active: "ساري",
  expiring_soon: "ينتهي قريبًا",
  expired: "منتهي",
};

export default function RegulatorsPage() {
  const { t } = useLanguage();
  const { objections } = useObjections();
  const { requests } = usePickupRequests();
  const [governorate, setGovernorate] = useState<string>("الكل");
  const [permitStatus, setPermitStatus] = useState<PermitStatus | "الكل">("الكل");
  const [nameSearch, setNameSearch] = useState("");
  const [crSearch, setCrSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const governorateWilayats = useMemo(() => {
    if (governorate === "الكل") return null;
    return OMAN_GOVERNORATES.find((g) => g.name === governorate)?.wilayats ?? [];
  }, [governorate]);

  const filteredCompanies = useMemo(() => {
    const qName = nameSearch.trim().toLowerCase();
    const qCr = crSearch.trim().toLowerCase();
    return COLLECTORS.filter((c) => {
      if (governorateWilayats && !governorateWilayats.includes(c.wilayat)) return false;
      if (permitStatus !== "الكل" && c.permitStatus !== permitStatus) return false;
      if (qName && !c.name.toLowerCase().includes(qName)) return false;
      if (qCr && !c.crNumber.toLowerCase().includes(qCr)) return false;
      return true;
    });
  }, [governorateWilayats, permitStatus, nameSearch, crSearch]);

  const activeCount = filteredCompanies.filter((c) => c.permitStatus === "active").length;
  const expiringCount = filteredCompanies.filter((c) => c.permitStatus === "expiring_soon").length;
  const expiredCount = filteredCompanies.filter((c) => c.permitStatus === "expired").length;
  const totalTons = filteredCompanies.reduce((sum, c) => sum + c.deliveredTonsToDate, 0);
  const carbonAvoidedTons = Math.round((totalTons * CARBON_AVOIDED_KG_PER_TON) / 1000);
  const pendingPickups = requests.filter((r) => r.status === "pending").length;
  const openObjections = objections.filter((o) => o.status === "pending").length;

  function exportCsv() {
    const headers = [
      "اسم الشركة",
      "الولاية",
      "رقم السجل التجاري",
      "حالة التصريح",
      "تاريخ انتهاء التصريح",
      "المركبات النشطة",
      "الأطنان المُسلَّمة",
    ];
    const rows = filteredCompanies.map((c) => [
      c.name,
      c.wilayat,
      c.crNumber,
      PERMIT_LABELS[c.permitStatus],
      c.permitExpiresAt,
      String(c.activeVehicles),
      String(c.deliveredTonsToDate),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير_الجهات_الرقابية_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3 print:hidden">
        <Link href="/" className="text-sm font-semibold text-neutral-400">
          {t("common.home")}
        </Link>
        <div className="flex items-center gap-2">
          <InvareMark size={30} />
          <LanguageToggle />
        </div>
      </div>
      <PortalSwitcher />

      <div className="mx-auto hidden w-full max-w-3xl flex-col gap-1 px-5 pt-6 print:flex">
        <h1 className="text-xl font-extrabold text-neutral-900">
          تقرير بوابة الجهات الرقابية — هيئة البيئة
        </h1>
        <p className="text-xs text-neutral-500">
          تاريخ الإصدار: {new Date().toLocaleDateString("ar-OM")}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6">
        <div className="print:hidden">
          <p className="text-xs font-medium text-neutral-400">مرحبًا</p>
          <h1 className="text-lg font-extrabold text-neutral-900">بوابة الجهات الرقابية 🛡️</h1>
          <p className="mt-1 text-sm text-neutral-500">
            رؤية موحّدة على كامل السوق — الشركات المرخّصة وسلسلة التوريد والنشاط الحالي
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-brand-50 p-3 text-center">
            <p className="text-[11px] text-brand-700">الشركات المسجّلة</p>
            <p className="text-lg font-extrabold text-brand-700">{filteredCompanies.length}</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 p-3 text-center">
            <p className="text-[11px] text-neutral-500">حالة التصاريح</p>
            <p className="text-lg font-extrabold text-neutral-800">{activeCount} ساري</p>
            <p className="text-[10px] text-neutral-400">
              {expiringCount} ينتهي قريبًا · {expiredCount} منتهي
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-100 p-3 text-center">
            <p className="text-[11px] text-neutral-500">الكربون المتجنَّب (تقديري)</p>
            <p className="text-lg font-extrabold text-neutral-800">{carbonAvoidedTons} طن CO₂</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#fafafa" }}>
            <p className="mb-1 text-[11px] text-neutral-400">نشاط مباشر</p>
            <p className="text-xs font-semibold text-neutral-600">
              {pendingPickups} طلب سحب · {openObjections} اعتراض مفتوح
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 print:hidden">
          <p className="text-xs font-bold text-neutral-500">فلاتر المراقبة</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="الكل">كل المحافظات</option>
              {OMAN_GOVERNORATES.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={permitStatus}
              onChange={(e) => setPermitStatus(e.target.value as PermitStatus | "الكل")}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="الكل">كل حالات التصريح</option>
              {Object.entries(PERMIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="بحث باسم الشركة"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
            />

            <input
              value={crSearch}
              onChange={(e) => setCrSearch(e.target.value)}
              placeholder="بحث برقم السجل التجاري"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="print:hidden">
          <h2 className="mb-3 text-sm font-bold text-neutral-700">خريطة الشركات المسجّلة</h2>
          <RouteMap
            pendingPoints={filteredCompanies.map((c) => ({
              id: c.id,
              label: c.name,
              sub: `${c.wilayat} · ${c.deliveredTonsToDate} طن مُسلَّم`,
              lat: WILAYAT_COORDS[c.wilayat].lat,
              lng: WILAYAT_COORDS[c.wilayat].lng,
            }))}
            routePoints={[]}
            onPendingClick={(id) => setExpandedId((prev) => (prev === id ? null : id))}
            heightClassName="h-64"
          />
        </div>

        <div className="flex gap-2 print:hidden">
          <button
            onClick={exportCsv}
            className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-xs font-bold text-neutral-700 active:scale-95"
          >
            تصدير CSV ⬇️
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white active:scale-95"
          >
            طباعة التقرير 🖨️
          </button>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-neutral-700">
            الشركات المرخّصة ({filteredCompanies.length})
          </h2>
          {filteredCompanies.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
              ما فيه شركات مطابقة للفلاتر المحدّدة
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCompanies.map((c) => (
                <CompanyCard
                  key={c.id}
                  company={c}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId((prev) => (prev === c.id ? null : c.id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
