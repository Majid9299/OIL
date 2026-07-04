"use client";

import Link from "next/link";
import { ContractWithCollector } from "@/components/generators/ContractWithCollector";
import { InvareMark } from "@/components/InvareMark";
import { useGeneratorData } from "@/components/generators/GeneratorDataProvider";

export default function ContractPage() {
  const { setContractedCollector } = useGeneratorData();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/generators" className="text-sm font-semibold text-neutral-400">
          ← رجوع
        </Link>
        <InvareMark size={24} />
      </div>
      <ContractWithCollector onSigned={setContractedCollector} />
    </div>
  );
}
