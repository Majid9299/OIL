"use client";

import Link from "next/link";
import { useGeneratorData } from "./GeneratorDataProvider";

export function RequireOwner({ children }: { children: React.ReactNode }) {
  const { role } = useGeneratorData();

  if (role !== "owner") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-14 text-center">
        <span className="text-4xl">🔒</span>
        <p className="text-base font-bold text-neutral-900">هذه الصفحة للمالك فقط</p>
        <p className="text-sm text-neutral-400">
          الأشخاص المخوّلون يقدرون فقط يبلّغون المجمّع بالكميات الجاهزة للسحب
        </p>
        <Link href="/generators" className="mt-2 text-sm font-bold text-brand-700">
          رجوع لتنبيه المجمّع ←
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
