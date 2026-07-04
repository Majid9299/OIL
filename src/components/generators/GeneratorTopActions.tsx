"use client";

import Link from "next/link";
import { useGeneratorData } from "./GeneratorDataProvider";

interface TopAction {
  href: string;
  label: string;
  icon: string;
  done?: boolean;
}

export function GeneratorTopActions() {
  const { registration, role } = useGeneratorData();
  const isRegistered = Boolean(registration.taxNumber && registration.crNumber);

  const sharedActions: TopAction[] = [
    { href: "/generators/contract", label: "اختيار المجمّع", icon: "🤝" },
    { href: "/generators/wallet", label: "المحفظة", icon: "💰" },
  ];

  const ownerOnlyActions: TopAction[] = [
    { href: "/generators/branches", label: "البيانات", icon: "📊" },
    {
      href: "/generators/register",
      label: "تسجيل الشركة",
      icon: "📝",
      done: isRegistered,
    },
  ];

  const actions = role === "owner" ? [...sharedActions, ...ownerOnlyActions] : sharedActions;

  return (
    <div
      className="grid gap-2 px-5 pt-4"
      style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
    >
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="relative flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white py-3 text-center transition active:scale-95"
        >
          {a.done && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
          )}
          <span className="text-xl">{a.icon}</span>
          <span className="text-xs font-bold text-neutral-700">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
