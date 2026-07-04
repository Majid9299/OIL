export type Locale = "ar" | "en";

export const translations: Record<Locale, Record<string, string>> = {
  ar: {
    "common.home": "← الرئيسية",
    "common.pilotBadge": "نموذج تجريبي · عُمان",

    "portal.generators": "مولّدون",
    "portal.collectors": "مجمّعون",
    "portal.factories": "مصانع",
    "portal.regulators": "جهات رقابية",

    "home.title": "منصة الاقتصاد الدائري التي تربط سوق النفايات القابلة لإعادة التدوير",
    "home.subtitle":
      "من مصدر النفاية إلى المصنع النهائي — كل طرف له بوابته الخاصة، وكل طرف يعمل بخصوصية تامة ضمن نفس البنية التحتية والقواعد التنظيمية المعتمدة من هيئة البيئة.",
    "home.card.generators.title": "مولّدو الزيوت",
    "home.card.generators.desc": "مطاعم وفنادق تسحب زيت الطبخ المستعمل بضغطة زر واحدة.",
    "home.card.collectors.title": "شركات التجميع",
    "home.card.collectors.desc": "إدارة الأسطول، الطلبات الواردة، والمخزون.",
    "home.card.factories.title": "المصانع",
    "home.card.factories.desc": "سحب عادل من المجمّعين المرخّصين بحياد كامل.",
    "home.card.regulators.title": "الجهات الرقابية",
    "home.card.regulators.desc": "رؤية موحّدة على كامل السوق لهيئة البيئة وشركائها.",
    "home.enterPortal": "الدخول إلى البوابة ←",
    "home.comingSoon": "قريبًا",
    "home.footer": "Invare · invare.om · شركة ماجد سعود البطاشي للتجارة",
  },
  en: {
    "common.home": "← Home",
    "common.pilotBadge": "Pilot · Oman",

    "portal.generators": "Generators",
    "portal.collectors": "Collectors",
    "portal.factories": "Factories",
    "portal.regulators": "Regulators",

    "home.title": "The circular-economy platform connecting the recyclable waste market",
    "home.subtitle":
      "From the waste source to the final factory — every party has its own portal, operating with full privacy on the same infrastructure and regulatory rules approved by the Environment Authority.",
    "home.card.generators.title": "Oil Generators",
    "home.card.generators.desc": "Restaurants and hotels request used cooking oil pickup with one tap.",
    "home.card.collectors.title": "Collection Companies",
    "home.card.collectors.desc": "Manage your fleet, incoming requests, and inventory.",
    "home.card.factories.title": "Factories",
    "home.card.factories.desc": "Fair, rotation-based sourcing from licensed collectors, fully anonymized.",
    "home.card.regulators.title": "Regulators",
    "home.card.regulators.desc": "A unified view of the entire market for the Environment Authority and its partners.",
    "home.enterPortal": "Enter portal ←",
    "home.comingSoon": "Coming soon",
    "home.footer": "Invare · invare.om · Majid Saud Al Battashi Trading Co.",
  },
};
