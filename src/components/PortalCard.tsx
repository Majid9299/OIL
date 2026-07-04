import Link from "next/link";

interface PortalCardProps {
  href: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  available: boolean;
  enterLabel?: string;
  comingSoonLabel?: string;
}

export function PortalCard({
  href,
  title,
  description,
  icon,
  accent,
  available,
  enterLabel = "الدخول إلى البوابة ←",
  comingSoonLabel = "قريبًا",
}: PortalCardProps) {
  const content = (
    <div
      className="group relative flex h-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTopWidth: 4, borderTopColor: accent }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
        style={{ backgroundColor: `${accent}1a` }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {available ? (
          <span className="text-brand-700" style={{ color: accent }}>
            {enterLabel}
          </span>
        ) : (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-400">
            {comingSoonLabel}
          </span>
        )}
      </div>
    </div>
  );

  if (!available) {
    return <div className="h-full opacity-70">{content}</div>;
  }

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
