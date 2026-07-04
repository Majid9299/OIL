export type PermitStatus = "active" | "expiring_soon" | "expired";

export interface ContainerType {
  id: string;
  label: string;
  literCapacity: number;
  icon: string;
}

export interface Collector {
  id: string;
  name: string;
  region: string;
  wilayat: string;
  crNumber: string;
  rating: number; // 1-5
  activeVehicles: number;
  permitStatus: PermitStatus;
  permitExpiresAt: string; // ISO date
  distanceKm: number;
  deliveredTonsToDate: number;
}

export interface PickupRequest {
  id: string;
  collectorId: string;
  generatorName: string;
  branchName: string;
  wilayat: string;
  lat: number;
  lng: number;
  totalLiters: number;
  totalOMR: number;
  createdAt: string;
  status: "pending" | "completed";
}

export interface RoutePoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "request" | "custom";
  requestId?: string;
  wilayat?: string;
}

export interface PermitDocument {
  id: string;
  name: string;
  expiresAt: string; // ISO date
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  driverWhatsapp: string;
  active: boolean;
  permitDocuments: PermitDocument[]; // تصاريح نقل الزيوت المستعملة المرفقة — أكثر من مستند لكل مركبة
}

export interface AuthorizedUser {
  id: string;
  name: string;
  whatsapp: string;
}

export interface MonthlySales {
  month: string;
  liters: number;
}

export interface Branch {
  id: string;
  name: string;
  region: string;
  totalLitersToDate: number;
  lastPickupAt: string;
  authorizedUsers: AuthorizedUser[];
  monthlySales: MonthlySales[];
  assignedCollectorId: string | null;
}

export interface CompanyRegistration {
  companyName: string;
  taxNumber: string;
  crNumber: string;
  whatsapp: string;
  email: string;
  documents: PermitDocument[]; // توثيق التصريح والسجل التجاري
}

export type BatchStatus = "offered" | "accepted" | "rejected" | "objected";

export interface OilBatch {
  id: string;
  collectorId: string; // لا يُكشف للمصنع إلا بعد قبول الدفعة — حياد كامل في مصدر المادة
  rotationSeq: number;
  rotationTotal: number;
  tons: number;
  pricePerTonOMR: number;
  totalOMR: number;
  offeredAt: string; // ISO date
  status: BatchStatus;
}

export interface Objection {
  id: string;
  batchId: string;
  factoryName: string;
  note: string;
  labReportName: string | null;
  createdAt: string; // ISO date
  status: "pending" | "upheld" | "rejected";
}

export type WalletTxType =
  | "sale_credit"
  | "sale_debit"
  | "freeze"
  | "unfreeze"
  | "withdrawal"
  | "deposit_admin"
  | "admin_debit"
  | "reversal"
  | "commission";

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  direction: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  status: "pending" | "completed";
  reason: string;
  createdAt: string; // ISO date
}

export interface Wallet {
  totalBalance: number;
  availableBalance: number;
  frozenBalance: number;
  currency: string;
  transactions: WalletTransaction[];
}
