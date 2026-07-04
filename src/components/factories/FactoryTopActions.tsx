"use client";

import Link from "next/link";
import { useFactoryData } from "./FactoryDataProvider";

export function FactoryTopActions() {
  const { registration } = useFactoryData();
  const isRegistered = Boolean(registration.taxNumber && registration.crNumber);

  const actions = [
    { href: "/factories/register", label: "تسجيل المصنع", icon: "📝", done: isRegistered },
    { href: "/factories/transactions", label: "سجل المعاملات", icon: "📒" },
    { href: "/factories/wallet", label: "المحفظة", icon: "💰" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 px-5 pt-4">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="relative flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white py-3 text-center transition active:scale-95"
        >
          {"done" in a && a.done && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
          )}
          <span className="text-xl">{a.icon}</span>
          <span className="text-xs font-bold text-neutral-700">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
