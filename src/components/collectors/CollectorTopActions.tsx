"use client";

import Link from "next/link";
import { useCollectorData } from "./CollectorDataProvider";

export function CollectorTopActions() {
  const { role, registration } = useCollectorData();
  const isRegistered = Boolean(registration.taxNumber && registration.crNumber);

  if (role !== "owner") {
    return null;
  }

  const actions = [
    { href: "/collectors/route", label: "المسار والخريطة", icon: "🗺️" },
    { href: "/collectors/fleet", label: "الأسطول", icon: "🚚" },
    { href: "/collectors/wallet", label: "المحفظة", icon: "💰" },
    {
      href: "/collectors/register",
      label: "تسجيل الشركة",
      icon: "📝",
      done: isRegistered,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-5 pt-4">
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
