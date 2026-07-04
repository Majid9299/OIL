"use client";

import Link from "next/link";
import { InvareMark } from "@/components/InvareMark";
import { BranchCard } from "@/components/generators/BranchCard";
import { RequireOwner } from "@/components/generators/RequireOwner";
import { useGeneratorData } from "@/components/generators/GeneratorDataProvider";

function BranchesList() {
  const { branches, addAuthorizedUser } = useGeneratorData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-8">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">الفروع</h1>
        <p className="text-sm text-neutral-400">
          كل الفروع التابعة لمنشأتك — خوّل أي شخص بإدارة الفرع عبر رقم واتساب
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {branches.map((b) => (
          <BranchCard
            key={b.id}
            branch={b}
            onAuthorize={(name, whatsapp) => addAuthorizedUser(b.id, { name, whatsapp })}
          />
        ))}
      </div>
    </div>
  );
}

export default function BranchesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/generators" className="text-sm font-semibold text-neutral-400">
          ← رجوع
        </Link>
        <InvareMark size={24} />
      </div>

      <RequireOwner>
        <BranchesList />
      </RequireOwner>
    </div>
  );
}
