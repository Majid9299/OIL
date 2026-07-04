"use client";

import { PortalCard } from "@/components/PortalCard";
import { InvareMark } from "@/components/InvareMark";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useLanguage } from "@/components/shared/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <InvareMark size={34} withWordmark />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {t("common.pilotBadge")}
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold leading-tight text-neutral-900 sm:text-4xl">
            {t("home.title")}
          </h1>
          <p className="mt-4 text-base leading-8 text-neutral-500">{t("home.subtitle")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PortalCard
            href="/generators"
            title={t("home.card.generators.title")}
            description={t("home.card.generators.desc")}
            icon="🛢️"
            accent="var(--color-oil)"
            available={true}
            enterLabel={t("home.enterPortal")}
          />
          <PortalCard
            href="/collectors"
            title={t("home.card.collectors.title")}
            description={t("home.card.collectors.desc")}
            icon="🚛"
            accent="var(--color-brand-600)"
            available={true}
            enterLabel={t("home.enterPortal")}
          />
          <PortalCard
            href="/factories"
            title={t("home.card.factories.title")}
            description={t("home.card.factories.desc")}
            icon="🏭"
            accent="var(--color-metal)"
            available={true}
            enterLabel={t("home.enterPortal")}
          />
          <PortalCard
            href="/regulators"
            title={t("home.card.regulators.title")}
            description={t("home.card.regulators.desc")}
            icon="🛡️"
            accent="var(--color-electronics)"
            available={true}
            enterLabel={t("home.enterPortal")}
          />
        </div>
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        {t("home.footer")}
      </footer>
    </div>
  );
}
