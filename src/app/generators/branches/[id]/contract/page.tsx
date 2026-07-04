"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InvareMark } from "@/components/InvareMark";
import { ContractWithCollector } from "@/components/generators/ContractWithCollector";
import { RequireOwner } from "@/components/generators/RequireOwner";
import { useGeneratorData } from "@/components/generators/GeneratorDataProvider";

export default function BranchContractPage() {
  const { id } = useParams<{ id: string }>();
  const { branches, assignCollectorToBranch } = useGeneratorData();
  const branch = branches.find((b) => b.id === id);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link
          href={`/generators/branches/${id}`}
          className="text-sm font-semibold text-neutral-400"
        >
          ← رجوع للفرع
        </Link>
        <InvareMark size={24} />
      </div>

      <RequireOwner>
        {branch ? (
          <ContractWithCollector
            subjectLabel={branch.name}
            onSigned={(collector) => assignCollectorToBranch(branch.id, collector.id)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            الفرع غير موجود
          </div>
        )}
      </RequireOwner>
    </div>
  );
}
