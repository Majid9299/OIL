import Link from "next/link";
import { InvareMark } from "@/components/InvareMark";

interface ComingSoonPortalProps {
  title: string;
  icon: string;
  accent: string;
  features: string[];
}

export function ComingSoonPortal({ title, icon, accent, features }: ComingSoonPortalProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/" className="text-sm font-semibold text-neutral-400">
          ← الرئيسية
        </Link>
        <InvareMark size={24} />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 py-14 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: `${accent}1a` }}
        >
          {icon}
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-neutral-900">{title}</h1>
        <span className="mt-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-400">
          قيد التطوير — الوظائف القادمة
        </span>

        <ul className="mt-8 w-full space-y-3 text-right">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-600"
            >
              <span className="mt-0.5 text-neutral-300">◆</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
