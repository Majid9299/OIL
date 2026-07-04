"use client";

import Link from "next/link";
import { GeneratorFlow } from "@/components/generators/GeneratorFlow";
import { GeneratorTopActions } from "@/components/generators/GeneratorTopActions";
import { RoleSwitcher } from "@/components/generators/RoleSwitcher";
import { InvareMark } from "@/components/InvareMark";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useLanguage } from "@/components/shared/LanguageProvider";

export default function GeneratorsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/" className="text-sm font-semibold text-neutral-400">
          {t("common.home")}
        </Link>
        <div className="flex items-center gap-2">
          <InvareMark size={30} />
          <LanguageToggle />
        </div>
      </div>
      <PortalSwitcher />
      <div className="flex justify-center border-b border-neutral-200 bg-white px-5 py-2.5">
        <RoleSwitcher />
      </div>
      <GeneratorTopActions />
      <GeneratorFlow />
    </div>
  );
}
