"use client";

import { useMemo, useState } from "react";
import { useWallet, WalletOwner } from "./WalletProvider";
import { WalletTxType } from "@/lib/types";

const TYPE_LABELS: Record<WalletTxType, string> = {
  sale_credit: "بيع",
  sale_debit: "شراء",
  freeze: "مبلغ محتجز",
  unfreeze: "إفراج عن مبلغ",
  withdrawal: "طلب سحب",
  deposit_admin: "إيداع يدوي",
  admin_debit: "خصم يدوي",
  reversal: "استرداد",
  commission: "عمولة المنصة",
};

type DirectionFilter = "all" | "credit" | "debit";
type StatusFilter = "all" | "pending" | "completed";

function roundOMR(value: number) {
  return Math.round(value * 100) / 100;
}

export function WalletView({ owner, title }: { owner: WalletOwner; title: string }) {
  const { wallets, requestWithdrawal } = useWallet();
  const wallet = wallets[owner];
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");

  const [typeFilter, setTypeFilter] = useState<"all" | WalletTxType>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function submitWithdrawal() {
    const value = Number(amount);
    if (!value || value <= 0 || !bankName.trim() || !iban.trim()) return;
    if (value > wallet.availableBalance) return;
    requestWithdrawal(owner, value, bankName.trim(), iban.trim());
    setAmount("");
    setBankName("");
    setIban("");
    setShowForm(false);
  }

  const filteredTransactions = useMemo(() => {
    return wallet.transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (directionFilter !== "all" && tx.direction !== directionFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      const day = tx.createdAt.slice(0, 10);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    });
  }, [wallet.transactions, typeFilter, directionFilter, statusFilter, dateFrom, dateTo]);

  const hasActiveFilters =
    typeFilter !== "all" ||
    directionFilter !== "all" ||
    statusFilter !== "all" ||
    dateFrom ||
    dateTo;

  function resetFilters() {
    setTypeFilter("all");
    setDirectionFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">محفظة {title}</h1>
        <p className="text-sm text-neutral-400">كل حركات المحفظة والأرصدة لحظة بلحظة</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-brand-50 p-3 text-center">
          <p className="text-[11px] text-brand-700">الرصيد الإجمالي</p>
          <p className="text-lg font-extrabold text-brand-700">
            {roundOMR(wallet.totalBalance)}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-100 p-3 text-center">
          <p className="text-[11px] text-neutral-500">المتاح</p>
          <p className="text-lg font-extrabold text-neutral-800">
            {roundOMR(wallet.availableBalance)}
          </p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#fafafa" }}>
          <p className="text-[11px] text-neutral-400">محتجز</p>
          <p className="text-lg font-extrabold text-neutral-600">
            {roundOMR(wallet.frozenBalance)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        {showForm ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-neutral-700">طلب سحب</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`المبلغ (المتاح: ${roundOMR(wallet.availableBalance)} ر.ع)`}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="اسم البنك"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="IBAN"
              dir="ltr"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={submitWithdrawal}
                disabled={
                  !amount ||
                  Number(amount) <= 0 ||
                  Number(amount) > wallet.availableBalance ||
                  !bankName.trim() ||
                  !iban.trim()
                }
                className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-bold text-white active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                إرسال الطلب
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl px-3 text-sm font-semibold text-neutral-400"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            disabled={wallet.availableBalance <= 0}
            className="h-12 w-full rounded-2xl bg-brand-600 text-sm font-bold text-white active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            طلب سحب
          </button>
        )}
      </div>

      {wallet.transactions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-500">فلاتر كشف الحساب</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs font-semibold text-brand-700">
                مسح الفلاتر
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 text-xs font-semibold">
            {(
              [
                { key: "all", label: "الكل" },
                { key: "credit", label: "دخل" },
                { key: "debit", label: "خرج" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDirectionFilter(opt.key)}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  directionFilter === opt.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 text-xs font-semibold">
            {(
              [
                { key: "all", label: "الكل" },
                { key: "completed", label: "مكتملة" },
                { key: "pending", label: "قيد المراجعة" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  statusFilter === opt.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500">نوع الحركة</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | WalletTxType)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">كل الأنواع</option>
              {(Object.keys(TYPE_LABELS) as WalletTxType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-neutral-700">
          كشف الحساب ({filteredTransactions.length})
        </h2>
        {wallet.transactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
            لا يوجد حركات بعد
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
            ما فيه حركات تطابق الفلاتر الحالية
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
              >
                <div
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold ${
                    tx.direction === "credit"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {tx.direction === "credit" ? "+" : "−"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-800">
                    {TYPE_LABELS[tx.type]}
                  </p>
                  <p className="text-xs text-neutral-400">{tx.reason}</p>
                  <p className="text-[10px] text-neutral-300">
                    {new Date(tx.createdAt).toLocaleString("ar-OM")}
                  </p>
                </div>
                <div className="text-left">
                  <p
                    className={`text-sm font-bold ${
                      tx.direction === "credit" ? "text-brand-700" : "text-red-600"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "-"}
                    {roundOMR(tx.amount)}
                  </p>
                  {tx.status === "pending" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      قيد المراجعة
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
