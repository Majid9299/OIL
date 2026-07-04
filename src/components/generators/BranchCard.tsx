"use client";

import { useState } from "react";
import Link from "next/link";
import { Branch } from "@/lib/types";

interface BranchCardProps {
  branch: Branch;
  onAuthorize: (name: string, whatsapp: string) => void;
}

export function BranchCard({ branch, onAuthorize }: BranchCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  function submit() {
    if (!name.trim() || !whatsapp.trim()) return;
    onAuthorize(name.trim(), whatsapp.trim());
    setName("");
    setWhatsapp("");
    setShowForm(false);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-neutral-900">{branch.name}</p>
          <p className="text-xs text-neutral-400">{branch.region}</p>
        </div>
        <Link
          href={`/generators/branches/${branch.id}`}
          className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
        >
          البيانات والتاريخ ←
        </Link>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-neutral-500">
        <span>إجمالي اللترات: {branch.totalLitersToDate}</span>
        <span>آخر سحب: {branch.lastPickupAt}</span>
      </div>

      {branch.authorizedUsers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {showForm ? (
          <div className="flex flex-col gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الشخص"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="رقم الواتساب (+968 ...)"
              dir="ltr"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={submit}
                className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-bold text-white active:scale-[0.98]"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl px-3 text-sm font-semibold text-neutral-400"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-brand-700"
          >
            + تخويل عبر واتساب
          </button>
        )}
      </div>
    </div>
  );
}
