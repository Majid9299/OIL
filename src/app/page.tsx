import { PortalCard } from "@/components/PortalCard";
import { InvareMark } from "@/components/InvareMark";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <InvareMark size={34} withWordmark />
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            نموذج تجريبي · عُمان
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold leading-tight text-neutral-900 sm:text-4xl">
            منصة الاقتصاد الدائري التي تربط سوق النفايات القابلة لإعادة التدوير
          </h1>
          <p className="mt-4 text-base leading-8 text-neutral-500">
            من مصدر النفاية إلى المصنع النهائي — كل طرف له بوابته الخاصة، وكل طرف
            يعمل بخصوصية تامة ضمن نفس البنية التحتية والقواعد التنظيمية المعتمدة
            من هيئة البيئة.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PortalCard
            href="/generators"
            title="مولّدو الزيوت"
            description="مطاعم وفنادق تسحب زيت الطبخ المستعمل بضغطة زر واحدة."
            icon="🛢️"
            accent="var(--color-oil)"
            available={true}
          />
          <PortalCard
            href="/collectors"
            title="شركات التجميع"
            description="إدارة الأسطول، الطلبات الواردة، والمخزون."
            icon="🚛"
            accent="var(--color-brand-600)"
            available={true}
          />
          <PortalCard
            href="/factories"
            title="المصانع"
            description="سحب عادل من المجمّعين المرخّصين بحياد كامل."
            icon="🏭"
            accent="var(--color-metal)"
            available={true}
          />
          <PortalCard
            href="/regulators"
            title="الجهات الرقابية"
            description="رؤية موحّدة على كامل السوق لهيئة البيئة وشركائها."
            icon="🛡️"
            accent="var(--color-electronics)"
            available={true}
          />
        </div>
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        Invare · invare.om · شركة ماجد سعود البطاشي للتجارة
      </footer>
    </div>
  );
}
