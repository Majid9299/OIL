import Link from "next/link";
import { InvareMark } from "@/components/InvareMark";
import { WalletView } from "@/components/shared/WalletView";
import { RequireCollectorOwner } from "@/components/collectors/RequireCollectorOwner";

export default function CollectorWalletPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/collectors" className="text-sm font-semibold text-neutral-400">
          ← رجوع
        </Link>
        <InvareMark size={24} />
      </div>
      <RequireCollectorOwner>
        <WalletView owner="collector" title="شركة التجميع" />
      </RequireCollectorOwner>
    </div>
  );
}
