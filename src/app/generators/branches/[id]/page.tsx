"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InvareMark } from "@/components/InvareMark";
import { BranchDetail } from "@/components/generators/BranchDetail";
import { RequireOwner } from "@/components/generators/RequireOwner";
import { useGeneratorData } from "@/components/generators/GeneratorDataProvider";

function BranchDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { branches } = useGeneratorData();
  const branch = branches.find((b) => b.id === id);

  if (!branch) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
        الفرع غير موجود
      </div>
    );
  }

  return <BranchDetail branch={branch} />;
}

export default function BranchDetailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/generators/branches" className="text-sm font-semibold text-neutral-400">
          ← رجوع للفروع
        </Link>
        <InvareMark size={24} />
      </div>

      <RequireOwner>
        <BranchDetailContent />
      </RequireOwner>
    </div>
  );
}
