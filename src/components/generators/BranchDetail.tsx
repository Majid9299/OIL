"use client";

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
import { COLLECTORS, PRICE_PER_LITER_OMR } from "@/lib/mock-data";
import { Branch } from "@/lib/types";

function roundOMR(value: number) {
  return Math.round(value * 100) / 100;
}

export function BranchDetail({ branch }: { branch: Branch }) {
  const totalOMRToDate = roundOMR(branch.totalLitersToDate * PRICE_PER_LITER_OMR);
  const assignedCollector = COLLECTORS.find((c) => c.id === branch.assignedCollectorId);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">{branch.name}</h1>
        <p className="text-sm text-neutral-400">{branch.region}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-brand-50 p-4 text-center">
          <p className="text-xs text-brand-700">إجمالي اللترات</p>
          <p className="text-xl font-extrabold text-brand-700">
            {branch.totalLitersToDate}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-100 p-4 text-center">
          <p className="text-xs text-neutral-500">إجمالي المبالغ</p>
          <p className="text-xl font-extrabold text-neutral-800">{totalOMRToDate} ر.ع</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-neutral-700">المبيعات الشهرية (لتر)</p>
        <div className="h-56" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branch.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#a3a3a3" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a3a3a3" />
              <Tooltip
                formatter={(value) => [`${value} لتر`, "الكمية"] as const}
                contentStyle={{ fontFamily: "var(--font-cairo)", direction: "rtl" }}
              />
              <Bar dataKey="liters" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-neutral-700">سجل الأشهر</p>
        <div className="flex flex-col divide-y divide-neutral-100">
          {branch.monthlySales.map((m) => (
            <div key={m.month} className="flex items-center justify-between py-2 text-sm">
              <span className="text-neutral-500">{m.month}</span>
              <span className="font-semibold text-neutral-900">{m.liters} لتر</span>
              <span className="text-neutral-400">
                {roundOMR(m.liters * PRICE_PER_LITER_OMR)} ر.ع
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-bold text-neutral-700">المجمّع المتعاقد معه لهذا الفرع</p>
        <p className="mb-3 text-xs text-neutral-400">
          تنبيهات هذا الفرع ترسل تلقائيًا للمجمّع المتعاقد معه
        </p>

        {assignedCollector ? (
          <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
            <div>
              <p className="text-sm font-bold text-brand-700">✓ {assignedCollector.name}</p>
              <p className="text-xs text-brand-600">عقد ساري</p>
            </div>
            <Link
              href={`/generators/branches/${branch.id}/contract`}
              className="text-xs font-semibold text-neutral-500 underline underline-offset-2"
            >
              تغيير المجمّع
            </Link>
          </div>
        ) : (
          <Link
            href={`/generators/branches/${branch.id}/contract`}
            className="flex h-12 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white active:scale-[0.98]"
          >
            تعاقد مع مجمّع لهذا الفرع
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-neutral-700">الأشخاص المخوّلون</p>
        {branch.authorizedUsers.length === 0 ? (
          <p className="text-xs text-neutral-400">لا يوجد أحد مخوّل بعد لهذا الفرع</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {branch.authorizedUsers.map((u) => (
              <span
                key={u.id}
                className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600"
              >
                📱 {u.name} · {u.whatsapp}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
