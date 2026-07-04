# Invare — Commission & Tax Calculation Logic

> Drop this file into your project and reference it in every financial calculation.
> All amounts are in **Omani Rial (OMR / ر.ع.)**.
> All monetary fields must be stored as **DECIMAL(18,4)** — never float or double.

---

## 1. Standard Transaction (No Deferred Payment)

### Inputs

| Variable | Description | Example |
|---|---|---|
| `unit_price` | Price per ton (OMR) | 200 |
| `quantity` | Number of tons | 10 |
| `vat_rate` | VAT rate (default 5%) | 0.05 |
| `invare_commission_per_unit` | Fixed per ton | 1 |

### Formulas

```
base_price          = unit_price × quantity
vat_on_base         = base_price × vat_rate

buyer_commission    = invare_commission_per_unit × quantity
vat_on_buyer_comm   = buyer_commission × vat_rate

seller_commission   = invare_commission_per_unit × quantity
vat_on_seller_comm  = seller_commission × vat_rate
```

### What the BUYER pays

```
buyer_total = base_price
            + vat_on_base
            + buyer_commission
            + vat_on_buyer_comm
```

### What the SELLER receives (net)

```
seller_net  = base_price
            + vat_on_base       — seller collects VAT on behalf of govt
            - seller_commission
            - vat_on_seller_comm
```

### Invare platform profit

```
invare_profit = buyer_commission
              + seller_commission
              + vat_on_buyer_comm
              + vat_on_seller_comm
```

### ✅ Verification check (must always pass)

```
buyer_total = seller_net + invare_profit
```

### Worked example — 10 tons × 200 OMR

| Line | Amount (OMR) |
|---|---|
| Base price (200 × 10) | 2,000.00 |
| VAT on base (×5%) | 100.00 |
| Buyer commission (1 × 10) | 10.00 |
| VAT on buyer commission | 0.50 |
| **Buyer total** | **2,110.50** |
| | |
| Base price | 2,000.00 |
| + VAT on base | 100.00 |
| − Seller commission | −10.00 |
| − VAT on seller commission | −0.50 |
| **Seller net** | **2,089.50** |
| | |
| **Invare profit** | **21.00** |
| Verification: 2,089.50 + 21.00 | = **2,110.50 ✓** |

---

## 2. Transaction WITH Deferred Payment (Ajal / آجل)

### Additional inputs

| Variable | Description | Example |
|---|---|---|
| `deferred_commission_per_unit` | Extra fee for deferred payment (OMR/ton) | 10 |
| `invare_commission_per_unit` | Same as standard | 10 |
| `vat_rate` | VAT rate | 0.15 — (15% used in deferred flow) |

### Formulas

```
base_price              = unit_price × quantity
vat_on_base             = base_price × vat_rate

invare_commission       = invare_commission_per_unit × quantity
deferred_commission     = deferred_commission_per_unit × quantity
vat_on_commissions      = (invare_commission + deferred_commission) × vat_rate
```

### What the BUYER pays

```
buyer_total = base_price
            + vat_on_base
            + invare_commission
            + deferred_commission
            + vat_on_commissions
```

### What the SELLER receives

```
seller_net  = base_price
            + vat_on_base
            - invare_commission
            - (invare_commission × vat_rate)   — only seller's share of comm VAT
```

### Invare platform profit

```
invare_profit = invare_commission          (from buyer)
              + deferred_commission        (from buyer)
              + invare_commission          (from seller)
              + vat_on_commissions
```

### Worked example — 10 tons × 100 OMR with deferred (VAT 15%)

| Line | Amount (OMR) |
|---|---|
| Base price (100 × 10) | 1,000.00 |
| VAT on base (×15%) | 150.00 |
| Invare commission (10 × 10) | 100.00 |
| Deferred commission (10 × 10) | 100.00 |
| VAT on commissions (200 × 15%) | 30.00 |
| **Buyer total** | **1,380.00** |
| | |
| **Seller net** | **1,035.00** |
| **Invare profit** | **345.00** |

---

## 3. Services Marketplace

```
provider_input_amount   = amount provider quotes
invare_cut              = provider_input_amount × 0.10      — 10% commission
vat_on_total             = provider_input_amount × 0.15      — 15% VAT

provider_net            = provider_input_amount - invare_cut - vat_on_total
requester_pays          = provider_input_amount + vat_on_total
```

### Worked example — Provider quotes 1,000 OMR

| Line | Amount (OMR) |
|---|---|
| Provider input | 1,000.00 |
| Invare cut (10%) | −100.00 |
| VAT (15%) | −150.00 |
| **Provider receives** | **750.00** |
| **Requester pays** | **1,150.00** |

---

## 4. VAT Rate Reference

| Context | VAT Rate |
|---|---|
| Standard material trade (Oman) | 5% |
| Deferred payment flow | 15% |
| Services marketplace | 15% |

> The VAT rate is configurable per transaction type in the admin settings table.
> Never hardcode rates — always read from `platform_settings.vat_rate`.

---

## 5. Implementation Rules

```
// REQUIRED: Always use DECIMAL(18,4)
unit_price              DECIMAL(18,4)
base_price              DECIMAL(18,4)
buyer_total             DECIMAL(18,4)
seller_net              DECIMAL(18,4)
invare_profit           DECIMAL(18,4)

// REQUIRED: Round final display values to 3 decimal places (OMR standard)
// REQUIRED: Keep full precision internally until final output

// REQUIRED: Always run verification before committing a transaction:
ASSERT buyer_total == seller_net + invare_profit

// REQUIRED: Wrap all financial DB writes in a single transaction (rollback on any failure)
```

---

## 6. Database Fields for Each Transaction

```sql
CREATE TABLE transactions (
  id                      UUID PRIMARY KEY,
  unit_price              DECIMAL(18,4) NOT NULL,
  quantity                DECIMAL(18,4) NOT NULL,
  base_price              DECIMAL(18,4) NOT NULL,
  vat_on_base             DECIMAL(18,4) NOT NULL,
  buyer_commission        DECIMAL(18,4) NOT NULL DEFAULT 0,
  vat_on_buyer_comm       DECIMAL(18,4) NOT NULL DEFAULT 0,
  seller_commission       DECIMAL(18,4) NOT NULL DEFAULT 0,
  vat_on_seller_comm      DECIMAL(18,4) NOT NULL DEFAULT 0,
  deferred_commission     DECIMAL(18,4) NOT NULL DEFAULT 0,
  vat_on_deferred_comm    DECIMAL(18,4) NOT NULL DEFAULT 0,
  buyer_total             DECIMAL(18,4) NOT NULL,
  seller_net              DECIMAL(18,4) NOT NULL,
  invare_profit           DECIMAL(18,4) NOT NULL,
  currency                VARCHAR(3)    NOT NULL DEFAULT 'OMR',
  is_deferred             BOOLEAN       NOT NULL DEFAULT FALSE,
  vat_rate                DECIMAL(5,4)  NOT NULL,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

*Owner: Majid Saud Albattashi — CEO Invare | majid@invaree.com*
*Last updated: July 2026 | Currency: Omani Rial (OMR)*
