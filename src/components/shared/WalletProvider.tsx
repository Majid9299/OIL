"use client";

import { createContext, useContext, useState } from "react";
import { Wallet, WalletTransaction, WalletTxType } from "@/lib/types";

export type WalletOwner = "generator" | "collector" | "factory" | "platform";

function emptyWallet(): Wallet {
  return {
    totalBalance: 0,
    availableBalance: 0,
    frozenBalance: 0,
    currency: "OMR",
    transactions: [],
  };
}

function makeTx(
  type: WalletTxType,
  direction: WalletTransaction["direction"],
  amount: number,
  balanceAfter: number,
  status: WalletTransaction["status"],
  reason: string
): WalletTransaction {
  return {
    id: `wtx-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    type,
    direction,
    amount,
    balanceAfter,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
}

interface WalletContextValue {
  wallets: Record<WalletOwner, Wallet>;
  credit: (owner: WalletOwner, type: WalletTxType, amount: number, reason: string) => void;
  debit: (owner: WalletOwner, type: WalletTxType, amount: number, reason: string) => void;
  /** يحتجز المبلغ من المتاح إلى المجمَّد عند إتمام البيع (قبل التسليم والاستلام) */
  freeze: (owner: WalletOwner, amount: number, reason: string) => void;
  /**
   * يُفرج عن المبلغ المجمَّد نهائيًا بعد تسليم البضاعة واستلام المشتري لها، ويوزّعه حسب
   * منطق العمولة والضريبة: صافي البائع (sellerNet) + عمولة إنفير (invareProfit) لمحفظة المنصة
   */
  releaseFrozenSplit: (
    buyer: WalletOwner,
    seller: WalletOwner,
    buyerTotal: number,
    sellerNet: number,
    invareProfit: number,
    buyerReason: string,
    sellerReason: string
  ) => void;
  /** يعيد المبلغ المجمَّد للمتاح — عند رفض/إلغاء الصفقة قبل الاستلام */
  cancelFreeze: (owner: WalletOwner, amount: number, reason: string) => void;
  requestWithdrawal: (
    owner: WalletOwner,
    amount: number,
    bankName: string,
    iban: string
  ) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Record<WalletOwner, Wallet>>({
    generator: emptyWallet(),
    collector: emptyWallet(),
    factory: emptyWallet(),
    platform: emptyWallet(),
  });

  function credit(owner: WalletOwner, type: WalletTxType, amount: number, reason: string) {
    setWallets((prev) => {
      const w = prev[owner];
      const available = w.availableBalance + amount;
      return {
        ...prev,
        [owner]: {
          ...w,
          availableBalance: available,
          totalBalance: available + w.frozenBalance,
          transactions: [
            makeTx(type, "credit", amount, available, "completed", reason),
            ...w.transactions,
          ],
        },
      };
    });
  }

  function debit(owner: WalletOwner, type: WalletTxType, amount: number, reason: string) {
    setWallets((prev) => {
      const w = prev[owner];
      const available = Math.max(0, w.availableBalance - amount);
      return {
        ...prev,
        [owner]: {
          ...w,
          availableBalance: available,
          totalBalance: available + w.frozenBalance,
          transactions: [
            makeTx(type, "debit", amount, available, "completed", reason),
            ...w.transactions,
          ],
        },
      };
    });
  }

  function freeze(owner: WalletOwner, amount: number, reason: string) {
    setWallets((prev) => {
      const w = prev[owner];
      const available = Math.max(0, w.availableBalance - amount);
      const frozen = w.frozenBalance + amount;
      return {
        ...prev,
        [owner]: {
          ...w,
          availableBalance: available,
          frozenBalance: frozen,
          totalBalance: available + frozen,
          transactions: [
            makeTx("freeze", "debit", amount, available, "pending", reason),
            ...w.transactions,
          ],
        },
      };
    });
  }

  function releaseFrozenSplit(
    buyer: WalletOwner,
    seller: WalletOwner,
    buyerTotal: number,
    sellerNet: number,
    invareProfit: number,
    buyerReason: string,
    sellerReason: string
  ) {
    // يُنهي احتجاز المشتري بكامل المبلغ (شامل العمولة والضريبة)، ويوزّعه: صافي للبائع
    // + عمولة إنفير لمحفظة المنصة — خطوة واحدة ذرّية عبر ثلاث محافظ
    setWallets((prev) => {
      const b = prev[buyer];
      const frozen = Math.max(0, b.frozenBalance - buyerTotal);
      const buyerNext: Wallet = {
        ...b,
        frozenBalance: frozen,
        totalBalance: b.availableBalance + frozen,
        transactions: [
          makeTx("unfreeze", "debit", buyerTotal, b.availableBalance, "completed", buyerReason),
          ...b.transactions,
        ],
      };

      const s = prev[seller];
      const sellerAvailable = s.availableBalance + sellerNet;
      const sellerNext: Wallet = {
        ...s,
        availableBalance: sellerAvailable,
        totalBalance: sellerAvailable + s.frozenBalance,
        transactions: [
          makeTx("sale_credit", "credit", sellerNet, sellerAvailable, "completed", sellerReason),
          ...s.transactions,
        ],
      };

      const p = prev.platform;
      const platformAvailable = p.availableBalance + invareProfit;
      const platformNext: Wallet = {
        ...p,
        availableBalance: platformAvailable,
        totalBalance: platformAvailable + p.frozenBalance,
        transactions: [
          makeTx(
            "commission",
            "credit",
            invareProfit,
            platformAvailable,
            "completed",
            `عمولة إنفير — ${sellerReason}`
          ),
          ...p.transactions,
        ],
      };

      return { ...prev, [buyer]: buyerNext, [seller]: sellerNext, platform: platformNext };
    });
  }

  function cancelFreeze(owner: WalletOwner, amount: number, reason: string) {
    setWallets((prev) => {
      const w = prev[owner];
      const frozen = Math.max(0, w.frozenBalance - amount);
      const available = w.availableBalance + amount;
      return {
        ...prev,
        [owner]: {
          ...w,
          availableBalance: available,
          frozenBalance: frozen,
          totalBalance: available + frozen,
          transactions: [
            makeTx("unfreeze", "credit", amount, available, "completed", reason),
            ...w.transactions,
          ],
        },
      };
    });
  }

  function requestWithdrawal(owner: WalletOwner, amount: number, bankName: string, iban: string) {
    setWallets((prev) => {
      const w = prev[owner];
      if (amount <= 0 || amount > w.availableBalance) return prev;
      const available = w.availableBalance - amount;
      const frozen = w.frozenBalance + amount;
      return {
        ...prev,
        [owner]: {
          ...w,
          availableBalance: available,
          frozenBalance: frozen,
          totalBalance: available + frozen,
          transactions: [
            makeTx(
              "withdrawal",
              "debit",
              amount,
              available,
              "pending",
              `طلب سحب — ${bankName} · ${iban}`
            ),
            ...w.transactions,
          ],
        },
      };
    });
  }

  return (
    <WalletContext.Provider
      value={{
        wallets,
        credit,
        debit,
        freeze,
        releaseFrozenSplit,
        cancelFreeze,
        requestWithdrawal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
