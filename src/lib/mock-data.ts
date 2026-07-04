import { Branch, Collector, ContainerType, OilBatch, Vehicle } from "./types";

export const STANDARD_BARREL_LITERS = 200; // the official 200L barrel referenced in the price agreement
export const PRICE_PER_BARREL_OMR = 10; // paid to generator per standard 200L barrel
export const PRICE_PER_LITER_OMR = PRICE_PER_BARREL_OMR / STANDARD_BARREL_LITERS;
export const PRICE_PER_TON_OMR = 180; // paid by factories
export const CARBON_AVOIDED_KG_PER_TON = 2600; // تقدير تقريبي للكربون المتجنَّب لكل طن زيت مُدوَّر بدل حرقه أو التخلص منه

export const WILAYAT_COORDS: Record<string, { lat: number; lng: number }> = {
  مسقط: { lat: 23.611, lng: 58.592 },
  مطرح: { lat: 23.628, lng: 58.594 },
  بوشر: { lat: 23.588, lng: 58.4059 },
  السيب: { lat: 23.6703, lng: 58.1889 },
  العامرات: { lat: 23.4989, lng: 58.4106 },
  قريات: { lat: 23.2633, lng: 58.9067 },
  سمائل: { lat: 23.2833, lng: 58.0333 },
  بهلاء: { lat: 22.9667, lng: 57.3 },
  نزوى: { lat: 22.9333, lng: 57.5333 },
  عبري: { lat: 23.2222, lng: 56.5167 },
  صحار: { lat: 24.3459, lng: 56.7098 },
  الرستاق: { lat: 23.3908, lng: 57.4247 },
  صور: { lat: 22.5667, lng: 59.5289 },
  إبراء: { lat: 22.9333, lng: 58.5333 },
  صلالة: { lat: 17.0151, lng: 54.0924 },
  البريمي: { lat: 24.2515, lng: 55.7933 },
  هيماء: { lat: 19.9569, lng: 56.2725 },
};

export const CURRENT_GENERATOR = {
  name: "مطعم الواحة الذهبية",
  branch: "فرع القرم",
  region: "مسقط",
  wilayat: "مسقط",
  lat: WILAYAT_COORDS["مسقط"].lat,
  lng: WILAYAT_COORDS["مسقط"].lng,
};

export const CONTAINER_TYPES: ContainerType[] = [
  { id: "can-5", label: "علبة", literCapacity: 5, icon: "🧴" },
  { id: "drum-200", label: "درام", literCapacity: 200, icon: "🛢️" },
  { id: "tank-1000", label: "خزان", literCapacity: 1000, icon: "🧊" },
];

export const COLLECTORS: Collector[] = [
  {
    id: "col-1",
    name: "شركة الخليج لتجميع الزيوت",
    region: "مسقط",
    wilayat: "مسقط",
    crNumber: "1029384",
    rating: 4.7,
    activeVehicles: 5,
    permitStatus: "active",
    permitExpiresAt: "2027-02-10",
    distanceKm: 3.2,
    deliveredTonsToDate: 19,
  },
  {
    id: "col-2",
    name: "مجمّعو عُمان الخضراء",
    region: "مسقط",
    wilayat: "مطرح",
    crNumber: "2093481",
    rating: 4.4,
    activeVehicles: 8,
    permitStatus: "active",
    permitExpiresAt: "2026-09-01",
    distanceKm: 5.8,
    deliveredTonsToDate: 38,
  },
  {
    id: "col-3",
    name: "الشركة الوطنية لإعادة التدوير",
    region: "مسقط",
    wilayat: "بوشر",
    crNumber: "3094812",
    rating: 4.9,
    activeVehicles: 12,
    permitStatus: "expiring_soon",
    permitExpiresAt: "2026-07-20",
    distanceKm: 7.1,
    deliveredTonsToDate: 61,
  },
  {
    id: "col-4",
    name: "بيئة الشرق لجمع الزيوت المستعملة",
    region: "مسقط",
    wilayat: "السيب",
    crNumber: "4098123",
    rating: 4.2,
    activeVehicles: 3,
    permitStatus: "active",
    permitExpiresAt: "2027-05-15",
    distanceKm: 9.4,
    deliveredTonsToDate: 12,
  },
];

export const CURRENT_COLLECTOR = COLLECTORS[0]; // شركة الخليج لتجميع الزيوت — المجمّع المتعاقد معه فرع القرم افتراضيًا

export const CURRENT_FACTORY = {
  name: "مصنع الخليج للصناعات الكيميائية",
  region: "مسقط",
  wilayat: "بوشر",
};

// دفعات ضمن نظام السحب العادل — هوية المجمّع (collectorId) لا تُعرض إلا بعد قبول الدفعة أو الاعتراض عليها
export const OIL_BATCHES: OilBatch[] = [
  ...COLLECTORS.map((c, i) => {
    const tons = [2.4, 1.8, 3.1, 1.2][i] ?? 2;
    return {
      id: `BATCH-${i + 1}`,
      collectorId: c.id,
      rotationSeq: i + 1,
      rotationTotal: COLLECTORS.length,
      tons,
      pricePerTonOMR: PRICE_PER_TON_OMR,
      totalOMR: Math.round(tons * PRICE_PER_TON_OMR * 100) / 100,
      offeredAt: new Date().toISOString(),
      status: "offered" as const,
    };
  }),
  {
    id: "BATCH-H1",
    collectorId: COLLECTORS[2].id,
    rotationSeq: 4,
    rotationTotal: 4,
    tons: 2.9,
    pricePerTonOMR: PRICE_PER_TON_OMR,
    totalOMR: Math.round(2.9 * PRICE_PER_TON_OMR * 100) / 100,
    offeredAt: "2026-06-20T00:00:00.000Z",
    status: "accepted" as const,
  },
  {
    id: "BATCH-H2",
    collectorId: COLLECTORS[0].id,
    rotationSeq: 1,
    rotationTotal: 4,
    tons: 1.6,
    pricePerTonOMR: PRICE_PER_TON_OMR,
    totalOMR: Math.round(1.6 * PRICE_PER_TON_OMR * 100) / 100,
    offeredAt: "2026-06-10T00:00:00.000Z",
    status: "accepted" as const,
  },
];

// طلبات سحب تجريبية موزّعة على عدة ولايات، لتوضيح تجميع الكميات على مسار واحد
export const SAMPLE_PENDING_REQUESTS = [
  {
    generatorName: "فندق الخليج الذهبي",
    branchName: "فرع مطرح",
    wilayat: "مطرح",
    totalLiters: 260,
  },
  {
    generatorName: "مطاعم الواحة",
    branchName: "فرع سمائل",
    wilayat: "سمائل",
    totalLiters: 180,
  },
  {
    generatorName: "مجمع بهلاء التجاري",
    branchName: "فرع بهلاء",
    wilayat: "بهلاء",
    totalLiters: 140,
  },
  {
    generatorName: "فندق نزوى القديمة",
    branchName: "فرع نزوى",
    wilayat: "نزوى",
    totalLiters: 220,
  },
].map((r, i) => ({
  ...r,
  id: `INV-SEED-${i + 1}`,
  collectorId: CURRENT_COLLECTOR.id,
  lat: WILAYAT_COORDS[r.wilayat].lat,
  lng: WILAYAT_COORDS[r.wilayat].lng,
  totalOMR: Math.round(r.totalLiters * PRICE_PER_LITER_OMR * 100) / 100,
  createdAt: new Date().toISOString(),
  status: "pending" as const,
}));

export type TransportPermitStatus = "active" | "expiring_soon" | "expired" | "missing";

export function getDocumentPermitStatus(
  expiresAt: string
): Exclude<TransportPermitStatus, "missing"> {
  const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring_soon";
  return "active";
}

export function getVehiclePermitStatus(documents: Vehicle["permitDocuments"]): TransportPermitStatus {
  if (documents.length === 0) return "missing";
  const statuses = documents.map((d) => getDocumentPermitStatus(d.expiresAt));
  if (statuses.includes("expired")) return "expired";
  if (statuses.includes("expiring_soon")) return "expiring_soon";
  return "active";
}

export const VEHICLES: Vehicle[] = [
  {
    id: "veh-1",
    plateNumber: "12345 / أ ب ج",
    driverName: "راشد الحارثي",
    driverWhatsapp: "+968 9911 2233",
    active: true,
    permitDocuments: [
      { id: "doc-1", name: "تصريح نقل زيوت الطبخ المستعملة", expiresAt: "2027-01-15" },
      { id: "doc-2", name: "تأمين المركبة", expiresAt: "2026-12-01" },
    ],
  },
  {
    id: "veh-2",
    plateNumber: "67890 / د هـ و",
    driverName: "ياسر البلوشي",
    driverWhatsapp: "+968 9922 3344",
    active: true,
    permitDocuments: [
      { id: "doc-3", name: "تصريح نقل زيوت الطبخ المستعملة", expiresAt: "2026-07-20" },
    ],
  },
  {
    id: "veh-3",
    plateNumber: "54321 / ز ح ط",
    driverName: "خالد السعدي",
    driverWhatsapp: "+968 9933 4455",
    active: false,
    permitDocuments: [],
  },
];

export interface GovernorateGroup {
  name: string;
  wilayats: string[];
}

export const OMAN_GOVERNORATES: GovernorateGroup[] = [
  { name: "مسقط", wilayats: ["مسقط", "مطرح", "بوشر", "السيب", "العامرات", "قريات"] },
  {
    name: "ظفار",
    wilayats: [
      "صلالة",
      "طاقة",
      "مرباط",
      "سدح",
      "رخيوت",
      "ضلكوت",
      "ثمريت",
      "مقشن",
      "شليم وجزر الحلانيات",
    ],
  },
  { name: "مسندم", wilayats: ["خصب", "بخا", "دبا", "مدحاء"] },
  { name: "البريمي", wilayats: ["البريمي", "محضة", "السنينة"] },
  {
    name: "الداخلية",
    wilayats: ["نزوى", "بهلاء", "منح", "الحمراء", "أدم", "سمائل", "بدبد", "إزكي"],
  },
  { name: "الظاهرة", wilayats: ["عبري", "ينقل", "ضنك"] },
  {
    name: "جنوب الباطنة",
    wilayats: ["الرستاق", "العوابي", "نخل", "وادي المعاول", "بركاء", "المصنعة"],
  },
  {
    name: "شمال الباطنة",
    wilayats: ["صحار", "شناص", "لوى", "صحم", "الخابورة", "السويق"],
  },
  {
    name: "جنوب الشرقية",
    wilayats: ["صور", "الكامل والوافي", "جعلان بني بو علي", "جعلان بني بو حسن", "مصيرة"],
  },
  {
    name: "شمال الشرقية",
    wilayats: ["إبراء", "المضيبي", "بدية", "القابل", "وادي بني خالد", "دماء والطائيين"],
  },
  { name: "الوسطى", wilayats: ["هيماء", "محوت", "الدقم", "الجازر"] },
];

const RECENT_MONTHS = ["فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو"];

export const BRANCHES: Branch[] = [
  {
    id: "br-1",
    name: "فرع القرم",
    region: "مسقط",
    totalLitersToDate: 4200,
    lastPickupAt: "2026-06-28",
    authorizedUsers: [{ id: "au-1", name: "سالم المطعم", whatsapp: "+968 9123 4567" }],
    monthlySales: [420, 560, 610, 700, 640, 580].map((liters, i) => ({
      month: RECENT_MONTHS[i],
      liters,
    })),
    assignedCollectorId: "col-1",
  },
  {
    id: "br-2",
    name: "فرع الخوض",
    region: "مسقط",
    totalLitersToDate: 2850,
    lastPickupAt: "2026-06-22",
    authorizedUsers: [],
    monthlySales: [310, 340, 300, 420, 460, 390].map((liters, i) => ({
      month: RECENT_MONTHS[i],
      liters,
    })),
    assignedCollectorId: null,
  },
  {
    id: "br-3",
    name: "فرع صلالة",
    region: "ظفار",
    totalLitersToDate: 1580,
    lastPickupAt: "2026-06-15",
    authorizedUsers: [{ id: "au-2", name: "فهد الفرع", whatsapp: "+968 9988 7766" }],
    monthlySales: [180, 210, 240, 260, 300, 250].map((liters, i) => ({
      month: RECENT_MONTHS[i],
      liters,
    })),
    assignedCollectorId: null,
  },
];
