// منطق العمولة والضريبة المعتمد من إنفير — انظر database/INVARE_COMMISSION_TAX_LOGIC.md
// القيم أدناه قابلة للتعديل من إعدادات المنصة لاحقًا (platform_settings) ولا يجب اعتبارها نهائية

export const VAT_RATE_STANDARD = 0.05; // ضريبة القيمة المضافة على تجارة المواد
export const INVARE_COMMISSION_PER_UNIT_OMR = 1; // عمولة إنفير لكل وحدة (طن/برميل)

export interface DealBreakdown {
  basePrice: number;
  vatOnBase: number;
  buyerCommission: number;
  vatOnBuyerComm: number;
  sellerCommission: number;
  vatOnSellerComm: number;
  buyerTotal: number; // ما يُحتجز من المشتري
  sellerNet: number; // ما يستلمه البائع فعليًا
  invareProfit: number; // عمولة إنفير (تُحتجز في محفظة المنصة)
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

// حساب صفقة قياسية بدون آجل — لا يشمل شروط الدفع الآجل (راجع القسم 2 من ملف منطق العمولة)
export function calculateStandardDeal(
  unitPrice: number,
  quantity: number,
  vatRate: number = VAT_RATE_STANDARD,
  commissionPerUnit: number = INVARE_COMMISSION_PER_UNIT_OMR
): DealBreakdown {
  const basePrice = round(unitPrice * quantity);
  const vatOnBase = round(basePrice * vatRate);
  const buyerCommission = round(commissionPerUnit * quantity);
  const vatOnBuyerComm = round(buyerCommission * vatRate);
  const sellerCommission = round(commissionPerUnit * quantity);
  const vatOnSellerComm = round(sellerCommission * vatRate);

  const buyerTotal = round(basePrice + vatOnBase + buyerCommission + vatOnBuyerComm);
  const sellerNet = round(basePrice + vatOnBase - sellerCommission - vatOnSellerComm);
  const invareProfit = round(
    buyerCommission + sellerCommission + vatOnBuyerComm + vatOnSellerComm
  );

  return {
    basePrice,
    vatOnBase,
    buyerCommission,
    vatOnBuyerComm,
    sellerCommission,
    vatOnSellerComm,
    buyerTotal,
    sellerNet,
    invareProfit,
  };
}
