"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PORTALS = [
  { href: "/generators", label: "مولّدون", icon: "🛢️" },
  { href: "/collectors", label: "مجمّعون", icon: "🚛" },
  { href: "/factories", label: "مصانع", icon: "🏭" },
  { href: "/regulators", label: "جهات رقابية", icon: "🛡️" },
] as const;

export function PortalSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-5 py-2.5 print:hidden">
      {PORTALS.map((p) => {
        const active = pathname?.startsWith(p.href);
        return (
          <Link
            key={p.href}
            href={p.href}
            className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            <span>{p.icon}</span>
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
