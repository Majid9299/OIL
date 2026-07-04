import Link from "next/link";
import { GeneratorFlow } from "@/components/generators/GeneratorFlow";
import { GeneratorTopActions } from "@/components/generators/GeneratorTopActions";
import { RoleSwitcher } from "@/components/generators/RoleSwitcher";
import { InvareMark } from "@/components/InvareMark";

export default function GeneratorsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/" className="text-sm font-semibold text-neutral-400">
          ← الرئيسية
        </Link>
        <InvareMark size={24} />
      </div>
      <div className="flex justify-center border-b border-neutral-200 bg-white px-5 py-2.5">
        <RoleSwitcher />
      </div>
      <GeneratorTopActions />
      <GeneratorFlow />
    </div>
  );
}
