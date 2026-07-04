"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InvareMark } from "@/components/InvareMark";
import { useFactoryData } from "@/components/factories/FactoryDataProvider";
import { useObjections } from "@/components/shared/ObjectionsProvider";
import { COLLECTORS, CURRENT_FACTORY } from "@/lib/mock-data";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "الكل",
  accepted: "مكتملة",
  objected: "قيد الاعتراض",
};

type StatusFilter = "all" | "accepted" | "objected";

function isoDate(value: string) {
  return value.slice(0, 10);
}

export default function FactoryTransactionsPage() {
  const { batches, registration } = useFactoryData();
  const { objections } = useObjections();
  const permitDoc = registration.documents[0];

  const allTransactions = useMemo(
    () => batches.filter((b) => b.status === "accepted" || b.status === "objected"),
    [batches]
  );

  const involvedCollectors = useMemo(
    () =>
      COLLECTORS.filter((c) => allTransactions.some((t) => t.collectorId === c.id)),
    [allTransactions]
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [collectorFilter, setCollectorFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const transactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (collectorFilter !== "all" && t.collectorId !== collectorFilter) return false;
      const day = isoDate(t.offeredAt);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    });
  }, [allTransactions, statusFilter, collectorFilter, dateFrom, dateTo]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, number>();
    transactions.forEach((t) => {
      const day = isoDate(t.offeredAt);
      byDate.set(day, (byDate.get(day) ?? 0) + t.tons);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, tons]) => ({
        day,
        label: new Date(day).toLocaleDateString("ar", { month: "short", day: "numeric" }),
        tons: Math.round(tons * 100) / 100,
      }));
  }, [transactions]);

  const totalTons = transactions.reduce((sum, t) => sum + t.tons, 0);
  const hasActiveFilters =
    statusFilter !== "all" || collectorFilter !== "all" || dateFrom || dateTo;

  function resetFilters() {
    setStatusFilter("all");
    setCollectorFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  const filterSummary = [
    `الحالة: ${STATUS_LABELS[statusFilter]}`,
    collectorFilter !== "all"
      ? `المصدر: ${COLLECTORS.find((c) => c.id === collectorFilter)?.name ?? ""}`
      : null,
    dateFrom || dateTo ? `الفترة: ${dateFrom || "البداية"} إلى ${dateTo || "اليوم"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 print:bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3 print:hidden">
        <Link href="/factories" className="text-sm font-semibold text-neutral-400">
          ← رجوع
        </Link>
        <InvareMark size={24} />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8 print:max-w-none">
        <div className="hidden print:block">
          <div className="mb-2 flex items-center justify-between">
            <InvareMark size={22} withWordmark />
            <p className="text-xs text-neutral-500">
              {new Date().toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <h1 className="text-lg font-extrabold text-neutral-900">
            سجل معاملات — {CURRENT_FACTORY.name}
          </h1>
          <p className="text-xs text-neutral-500">{filterSummary}</p>
        </div>

        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-lg font-extrabold text-neutral-900">سجل المعاملات</h1>
            <p className="text-sm text-neutral-400">
              كل معاملة مربوطة بالتصريح الصناعي والبيئي
              {permitDoc ? ` — ${permitDoc.name}` : " — لم يُرفق تصريح بعد"}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex flex-none items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 active:scale-95"
          >
            🖨️ طباعة / PDF
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 print:hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-500">الفلاتر</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs font-semibold text-brand-700">
                مسح الفلاتر
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 text-xs font-semibold">
            {(
              [
                { key: "all", label: "الكل" },
                { key: "accepted", label: "مكتملة" },
                { key: "objected", label: "قيد الاعتراض" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  statusFilter === opt.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500">المصدر</label>
            <select
              value={collectorFilter}
              onChange={(e) => setCollectorFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">كل المجمّعين</option>
              {involvedCollectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-neutral-700">الأطنان عبر الوقت</p>
            <p className="text-xs text-neutral-400">{totalTons} طن إجمالي</p>
          </div>
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400">
              ما فيه بيانات تطابق الفلاتر الحالية
            </p>
          ) : (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a3a3a3" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a3a3a3" />
                  <Tooltip
                    formatter={(value) => [`${value} طن`, "الكمية"] as const}
                    contentStyle={{ fontFamily: "var(--font-cairo)", direction: "rtl" }}
                  />
                  <Bar dataKey="tons" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {transactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
            ما فيه معاملات تطابق الفلاتر الحالية
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((t) => {
              const collector = COLLECTORS.find((c) => c.id === t.collectorId);
              return (
                <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-neutral-900">{collector?.name ?? "مجمّع"}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        t.status === "objected"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {t.status === "objected" ? "قيد الاعتراض" : "مكتملة"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {t.tons} طن · {t.totalOMR} ر.ع ·{" "}
                    {new Date(t.offeredAt).toLocaleDateString("ar")}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {objections.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-neutral-700">الاعتراضات المقدّمة</h2>
            <div className="flex flex-col gap-3">
              {objections.map((o) => (
                <div key={o.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">{o.note}</p>
                  {o.labReportName && (
                    <p className="mt-1 text-xs text-amber-700">📎 {o.labReportName}</p>
                  )}
                  <p className="mt-1 text-[11px] text-amber-600">
                    {new Date(o.createdAt).toLocaleDateString("ar")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
