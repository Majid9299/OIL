-- =====================================================================
-- INVARE — قاعدة البيانات الكاملة (PostgreSQL 14+)
-- منصة اقتصاد دائري رقمية — البوابات الأربع + جاهزية ISCC
-- إعداد لصالح: ماجد سعود البطاشي — CEO — Invare
-- الجهة المالكة: شركة ماجد سعود البطاشي للتجارة (invare.om) / شركة بيئة مستدامة (invare.sa)
-- تاريخ الإصدار: يوليو 2026
-- =====================================================================
-- ملاحظة تشغيلية: هذا الملف مصمم للتنفيذ الكامل على قاعدة فارغة.
-- شغّله بأمر: psql -U <user> -d invare_db -f invare_database_schema.sql
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 0. الأنواع المخصصة (ENUMs)
-- =====================================================================

CREATE TYPE org_type          AS ENUM ('collector','generator','factory','regulator');
CREATE TYPE org_status        AS ENUM ('pending_review','active','suspended','blacklisted');
CREATE TYPE permit_status     AS ENUM ('active','expired','suspended','revoked');
CREATE TYPE material_code     AS ENUM ('oil','plastic','metal','electronics','paper','wood_organic');
CREATE TYPE request_status    AS ENUM ('pending','offered','accepted','rejected','expired','completed','cancelled');
CREATE TYPE offer_status      AS ENUM ('pending','accepted','rejected','expired','superseded');
CREATE TYPE price_type        AS ENUM ('purchase_from_generator','sale_to_factory');
CREATE TYPE tx_direction      AS ENUM ('purchase_from_generator','sale_to_factory');
CREATE TYPE tx_status         AS ENUM ('pending','completed','disputed','cancelled','reversed');
CREATE TYPE objection_status  AS ENUM ('pending','upheld','rejected');
CREATE TYPE mass_balance_type AS ENUM ('mass_balance','segregated','physical_segregation');
CREATE TYPE iscc_scheme       AS ENUM ('ISCC_EU','ISCC_CORSIA','ISCC_PLUS','ISCC_NATIONAL');
CREATE TYPE cert_status       AS ENUM ('active','expired','suspended','withdrawn');
CREATE TYPE audit_type        AS ENUM ('point_of_origin','collecting_point','producer','surveillance');
CREATE TYPE audit_result      AS ENUM ('pass','fail','conditional','pending');
CREATE TYPE portal_role       AS ENUM ('collector','generator','factory','regulator','admin');
CREATE TYPE ledger_direction  AS ENUM ('credit','debit');
CREATE TYPE violation_status  AS ENUM ('open','under_review','closed','escalated');
CREATE TYPE drum_status       AS ENUM ('empty','filling','full','collected');
CREATE TYPE vehicle_status    AS ENUM ('active','inactive','maintenance');

-- أنواع خاصة بنظام المحفظة والفواتير (INVARE_WALLET_PRD.md v1.0 — يوليو 2026)
CREATE TYPE wallet_status     AS ENUM ('active','suspended','closed');
CREATE TYPE wallet_tx_type    AS ENUM (
    'sale_credit','sale_debit','auction_credit','auction_debit',
    'service_credit','service_debit','commission','vat',
    'withdrawal','deposit_card','deposit_admin','admin_debit',
    'deferred_payment','freeze','unfreeze','reversal'
);
CREATE TYPE wallet_tx_status  AS ENUM ('pending','completed','failed','reversed');
CREATE TYPE invoice_type      AS ENUM ('buyer_invoice','seller_invoice');
CREATE TYPE invoice_status    AS ENUM ('draft','issued','paid','cancelled');
CREATE TYPE withdrawal_status AS ENUM ('pending','approved','rejected','processing','completed');
CREATE TYPE wallet_adj_type   AS ENUM ('credit','debit');

-- تمييز "الأدمن المالي" عن "الأدمن العام" حسب جدول RBAC في وثيقة المحفظة (القسم 9.1)
-- ملاحظة: لا حاجة لجدول admins منفصل — الإدمنية دور ضمن users.portal_role القائم أصلاً
ALTER TYPE portal_role ADD VALUE IF NOT EXISTS 'finance_admin';

-- =====================================================================
-- 1. المؤسسات — جدول موحّد لكل الأطراف (الأساس لكل البوابات)
-- =====================================================================

CREATE TABLE organizations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_type                org_type NOT NULL,
    name_ar                 TEXT NOT NULL,
    name_en                 TEXT,
    commercial_reg_no       TEXT UNIQUE,               -- رقم السجل التجاري
    country                 TEXT NOT NULL DEFAULT 'OM', -- OM / SA
    region                  TEXT,                       -- المحافظة / المنطقة
    address                 TEXT,
    gps_lat                 NUMERIC(10,7),
    gps_lng                 NUMERIC(10,7),
    phone                   TEXT,
    email                   TEXT,
    status                  org_status NOT NULL DEFAULT 'pending_review',
    parent_org_id           UUID REFERENCES organizations(id), -- لربط الفروع بحساب مركزي (مولّدين)
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_type   ON organizations(org_type);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_region ON organizations(region);

-- =====================================================================
-- 2. المستخدمون وصلاحيات البوابات
-- =====================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    phone           TEXT UNIQUE,
    email           TEXT UNIQUE,
    password_hash   TEXT NOT NULL,
    portal_role     portal_role NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org ON users(organization_id);

-- =====================================================================
-- 3. التصاريح (تجارية + تصاريح ISCC ملحوظة بجدول منفصل لاحقًا)
-- =====================================================================

CREATE TABLE permits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permit_type     TEXT NOT NULL,              -- مثال: 'تصريح تجميع زيوت طبخ مستعملة'
    permit_number   TEXT NOT NULL,
    issued_by       TEXT NOT NULL,              -- هيئة البيئة / البلدية...
    issue_date      DATE NOT NULL,
    expiry_date     DATE NOT NULL,
    status          permit_status NOT NULL DEFAULT 'active',
    document_url    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, permit_number)
);

CREATE INDEX idx_permits_org      ON permits(organization_id);
CREATE INDEX idx_permits_expiry   ON permits(expiry_date);
CREATE INDEX idx_permits_status   ON permits(status);

-- تحديث تلقائي لحالة التصريح عند انتهاء تاريخه (تُستدعى دوريًا عبر cron/job)
CREATE OR REPLACE FUNCTION fn_expire_permits() RETURNS void AS $$
BEGIN
    UPDATE permits SET status = 'expired'
    WHERE status = 'active' AND expiry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 4. فئات المواد ومناطق التغطية
-- =====================================================================

CREATE TABLE material_categories (
    id          SMALLSERIAL PRIMARY KEY,
    code        material_code NOT NULL UNIQUE,
    name_ar     TEXT NOT NULL,
    name_en     TEXT NOT NULL,
    unit_hint   TEXT  -- مثال: 'برميل 200 لتر' أو 'طن'
);

INSERT INTO material_categories (code, name_ar, name_en, unit_hint) VALUES
    ('oil','زيوت الطبخ المستعملة','Used Cooking Oil','برميل 200 لتر / طن'),
    ('plastic','لدائن / بلاستيك','Plastic','طن'),
    ('metal','معادن','Metal','طن'),
    ('electronics','إلكترونيات','Electronics','طن / وحدة'),
    ('paper','ورق وكرتون','Paper','طن'),
    ('wood_organic','خشب وعضويات','Wood / Organic','طن');

CREATE TABLE coverage_areas (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_org_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    region_name         TEXT NOT NULL,
    material_category_id SMALLINT REFERENCES material_categories(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coverage_collector ON coverage_areas(collector_org_id);
CREATE INDEX idx_coverage_region    ON coverage_areas(region_name);

-- =====================================================================
-- 5. بوابة المجمّعين — الأسطول والمخزون
-- =====================================================================

CREATE TABLE collector_vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plate_number    TEXT NOT NULL,
    driver_name     TEXT,
    driver_phone    TEXT,
    gps_device_id   TEXT,           -- معرّف جهاز التتبع الحي
    capacity_liters NUMERIC(10,2),
    status          vehicle_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_collector ON collector_vehicles(collector_org_id);

CREATE TABLE vehicle_gps_log (
    id          BIGSERIAL PRIMARY KEY,
    vehicle_id  UUID NOT NULL REFERENCES collector_vehicles(id) ON DELETE CASCADE,
    gps_lat     NUMERIC(10,7) NOT NULL,
    gps_lng     NUMERIC(10,7) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gps_log_vehicle_time ON vehicle_gps_log(vehicle_id, recorded_at DESC);

-- المخزون الحالي لكل مجمّع = دالة محسوبة من المعاملات (وليس حقلًا مخزّنًا)، انظر VIEW في القسم 12.

-- =====================================================================
-- 6. بوابة المولّدين — الفروع والدرامات وطلبات السحب
-- =====================================================================

CREATE TABLE generator_branches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generator_org_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_name         TEXT NOT NULL,
    gps_lat             NUMERIC(10,7),
    gps_lng             NUMERIC(10,7),
    is_centrally_managed BOOLEAN NOT NULL DEFAULT false, -- هل تُدار مركزيًا من الحساب الأب
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_generator ON generator_branches(generator_org_id);

CREATE TABLE drums (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL REFERENCES generator_branches(id) ON DELETE CASCADE,
    material_category_id SMALLINT NOT NULL REFERENCES material_categories(id),
    capacity_liters NUMERIC(10,2) NOT NULL DEFAULT 200,
    status          drum_status NOT NULL DEFAULT 'empty',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drums_branch ON drums(branch_id);

CREATE TABLE pickup_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id           UUID NOT NULL REFERENCES generator_branches(id) ON DELETE CASCADE,
    drum_id             UUID REFERENCES drums(id),
    material_category_id SMALLINT NOT NULL REFERENCES material_categories(id),
    quantity_estimate_l NUMERIC(10,2),
    status              request_status NOT NULL DEFAULT 'pending',
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_pickup_branch  ON pickup_requests(branch_id);
CREATE INDEX idx_pickup_status  ON pickup_requests(status);

-- عروض التوزيع على المجمّعين المؤهّلين بالترتيب (خطوة 4-6 في سير العمل)
CREATE TABLE request_offers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_request_id   UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
    collector_org_id    UUID NOT NULL REFERENCES organizations(id),
    priority_rank       INTEGER NOT NULL,           -- 1 = الأولوية الأولى
    offered_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_deadline   TIMESTAMPTZ NOT NULL,        -- offered_at + مهلة القبول (قابلة للتهيئة، القسم 12 نقاط مفتوحة)
    status              offer_status NOT NULL DEFAULT 'pending',
    responded_at        TIMESTAMPTZ
);

CREATE INDEX idx_offers_request  ON request_offers(pickup_request_id);
CREATE INDEX idx_offers_collector ON request_offers(collector_org_id);
CREATE INDEX idx_offers_deadline  ON request_offers(status, response_deadline);

-- =====================================================================
-- 7. التسعير الرسمي — قيود صلبة غير قابلة للتلاعب (القسم 6 من التوثيق)
-- =====================================================================

CREATE TABLE pricing_rules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_category_id SMALLINT NOT NULL REFERENCES material_categories(id),
    price_type          price_type NOT NULL,
    unit                TEXT NOT NULL,           -- 'barrel_200l' أو 'ton'
    amount               NUMERIC(12,3) NOT NULL,
    currency             TEXT NOT NULL DEFAULT 'OMR',
    effective_from       DATE NOT NULL,
    effective_to         DATE,                    -- NULL = ساري حتى إشعار آخر
    set_by_user_id        UUID REFERENCES users(id),
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_lookup ON pricing_rules(material_category_id, price_type, is_active);

-- القاعدة الرسمية الافتتاحية حسب خطاب هيئة البيئة رقم 01-2026 بتاريخ 22 يونيو 2026
INSERT INTO pricing_rules (material_category_id, price_type, unit, amount, currency, effective_from)
SELECT id, 'purchase_from_generator', 'barrel_200l', 10.000, 'OMR', '2026-06-22'
FROM material_categories WHERE code = 'oil';

INSERT INTO pricing_rules (material_category_id, price_type, unit, amount, currency, effective_from)
SELECT id, 'sale_to_factory', 'ton', 180.000, 'OMR', '2026-06-22'
FROM material_categories WHERE code = 'oil';

-- =====================================================================
-- 8. العقود الإلكترونية والمعاملات المالية
-- =====================================================================

-- 8.0 إعدادات المنصة — مصدر واحد لنِسَب العمولة والضريبة، حسب منطق
-- INVARE_COMMISSION_TAX_LOGIC.md ("Never hardcode rates — always read from
-- platform_settings"). سطر واحد فقط (singleton) — يُعدَّل فقط عبر أدمن عام.
CREATE TABLE platform_settings (
    id                            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    vat_rate_standard             NUMERIC(5,4) NOT NULL DEFAULT 0.05,  -- تجارة مواد قياسية (5%)
    vat_rate_deferred             NUMERIC(5,4) NOT NULL DEFAULT 0.15,  -- صفقات آجلة (15%)
    vat_rate_services             NUMERIC(5,4) NOT NULL DEFAULT 0.15,  -- سوق الخدمات (15%)
    invare_commission_per_unit    NUMERIC(18,4) NOT NULL DEFAULT 1,    -- عمولة إنفير للوحدة (طن/برميل) — غير نهائية
    deferred_commission_per_unit  NUMERIC(18,4) NOT NULL DEFAULT 10,   -- رسم إضافي للوحدة عند الدفع الآجل — غير نهائي
    service_commission_rate       NUMERIC(5,4) NOT NULL DEFAULT 0.10,  -- عمولة سوق الخدمات (10%)
    updated_by                    UUID REFERENCES users(id),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id) VALUES (1);

CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_request_id   UUID REFERENCES pickup_requests(id),
    collector_org_id    UUID NOT NULL REFERENCES organizations(id),
    generator_branch_id UUID REFERENCES generator_branches(id),
    factory_org_id      UUID REFERENCES organizations(id),      -- يُملأ عند عقود البيع للمصنع
    contract_number     TEXT UNIQUE NOT NULL,
    qr_code_payload      TEXT UNIQUE NOT NULL,
    pdf_url               TEXT,
    generated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    status                 TEXT NOT NULL DEFAULT 'issued'
);

CREATE INDEX idx_contracts_collector ON contracts(collector_org_id);

CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID REFERENCES contracts(id),
    collector_org_id    UUID NOT NULL REFERENCES organizations(id),
    counterparty_org_id UUID NOT NULL REFERENCES organizations(id), -- المولّد أو المصنع حسب الاتجاه
    direction            tx_direction NOT NULL,
    material_category_id SMALLINT NOT NULL REFERENCES material_categories(id),
    quantity_kg           NUMERIC(12,3) NOT NULL CHECK (quantity_kg > 0),
    unit_price             NUMERIC(12,3) NOT NULL,
    unit                    TEXT NOT NULL,
    total_amount            NUMERIC(14,3) NOT NULL, -- = base_price (سعر الكمية قبل العمولة والضريبة)
    currency                 TEXT NOT NULL DEFAULT 'OMR',
    pricing_rule_id           UUID REFERENCES pricing_rules(id),   -- يربط المعاملة بالقاعدة الرسمية المطبَّقة وقت التنفيذ
    status                    tx_status NOT NULL DEFAULT 'pending',
    transaction_date           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- منطق العمولة والضريبة (database/INVARE_COMMISSION_TAX_LOGIC.md) — تُحسَب تلقائيًا
    -- عبر fn_calculate_commission_and_vat أدناه، ولا تُدخَل يدويًا
    is_deferred            BOOLEAN NOT NULL DEFAULT false,     -- صفقة بدفع آجل (Ajal)؟
    vat_rate                NUMERIC(5,4) NOT NULL DEFAULT 0,    -- النسبة المطبَّقة فعليًا وقت التنفيذ (نسخة مجمَّدة من platform_settings)
    base_price               NUMERIC(18,4) NOT NULL DEFAULT 0,  -- unit_price × quantity
    vat_on_base               NUMERIC(18,4) NOT NULL DEFAULT 0,
    buyer_commission           NUMERIC(18,4) NOT NULL DEFAULT 0,
    vat_on_buyer_comm            NUMERIC(18,4) NOT NULL DEFAULT 0,
    seller_commission              NUMERIC(18,4) NOT NULL DEFAULT 0,
    vat_on_seller_comm                NUMERIC(18,4) NOT NULL DEFAULT 0,
    deferred_commission                 NUMERIC(18,4) NOT NULL DEFAULT 0, -- فقط عند is_deferred = true
    vat_on_deferred_comm                   NUMERIC(18,4) NOT NULL DEFAULT 0,
    buyer_total                              NUMERIC(18,4) NOT NULL DEFAULT 0, -- ما يُحتجز من المشتري
    seller_net                                 NUMERIC(18,4) NOT NULL DEFAULT 0, -- ما يستلمه البائع فعليًا
    invare_profit                                NUMERIC(18,4) NOT NULL DEFAULT 0, -- عمولة إنفير الصافية ← invare_wallet

    CONSTRAINT chk_buyer_total_balances
        CHECK (buyer_total = seller_net + invare_profit) -- ✅ Verification check من الوثيقة
);

CREATE INDEX idx_tx_collector    ON transactions(collector_org_id);
CREATE INDEX idx_tx_counterparty ON transactions(counterparty_org_id);
CREATE INDEX idx_tx_material     ON transactions(material_category_id);
CREATE INDEX idx_tx_status       ON transactions(status);
CREATE INDEX idx_tx_date         ON transactions(transaction_date);

-- ---------------------------------------------------------------------
-- قيد صلب: منع تنفيذ أي معاملة إذا كان تصريح المجمّع غير ساري
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_permit_before_transaction() RETURNS TRIGGER AS $$
DECLARE
    v_active_permit_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_active_permit_count
    FROM permits
    WHERE organization_id = NEW.collector_org_id
      AND status = 'active'
      AND expiry_date >= CURRENT_DATE;

    IF v_active_permit_count = 0 THEN
        RAISE EXCEPTION 'لا يمكن إتمام المعاملة: تصريح شركة التجميع (%) منتهي أو غير مسجّل', NEW.collector_org_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_permit_before_transaction
    BEFORE INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_check_permit_before_transaction();

-- ---------------------------------------------------------------------
-- قيد صلب: تسجيل مخالفة تلقائيًا إذا كان السعر المُدخل مخالفًا للسعر الرسمي الساري
-- (نُبقيه كتسجيل مخالفة بدل رفض قاسي، لأن التسعير قد يخضع لهامش تفاوضي مستقبلاً)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_flag_price_violation() RETURNS TRIGGER AS $$
DECLARE
    v_official_price NUMERIC(12,3);
BEGIN
    SELECT amount INTO v_official_price
    FROM pricing_rules
    WHERE material_category_id = NEW.material_category_id
      AND price_type = NEW.direction::text::price_type
      AND is_active = true
      AND effective_from <= CURRENT_DATE
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;

    IF v_official_price IS NOT NULL AND NEW.unit_price <> v_official_price THEN
        INSERT INTO violations (organization_id, violation_type, description, related_transaction_id)
        VALUES (
            NEW.collector_org_id,
            'مخالفة تسعير',
            format('السعر المُدخل %s لا يطابق السعر الرسمي %s للفئة', NEW.unit_price, v_official_price),
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_price_violation
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_flag_price_violation();

-- ---------------------------------------------------------------------
-- منطق العمولة والضريبة (database/INVARE_COMMISSION_TAX_LOGIC.md، القسمان 1 و2)
-- يُحسَب buyer_total / seller_net / invare_profit تلقائيًا من platform_settings —
-- لا تُدخَل هذه القيم يدويًا أبدًا. يدعم الصفقة القياسية والصفقة الآجلة (is_deferred).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_commission_and_vat() RETURNS TRIGGER AS $$
DECLARE
    s platform_settings%ROWTYPE;
BEGIN
    SELECT * INTO s FROM platform_settings WHERE id = 1;

    NEW.base_price := NEW.unit_price * NEW.quantity_kg;

    IF NEW.is_deferred THEN
        NEW.vat_rate             := s.vat_rate_deferred;
        NEW.vat_on_base           := NEW.base_price * NEW.vat_rate;
        NEW.buyer_commission       := s.invare_commission_per_unit * NEW.quantity_kg;
        NEW.deferred_commission     := s.deferred_commission_per_unit * NEW.quantity_kg;
        NEW.vat_on_buyer_comm         := (NEW.buyer_commission + NEW.deferred_commission) * NEW.vat_rate;
        NEW.seller_commission           := s.invare_commission_per_unit * NEW.quantity_kg;
        NEW.vat_on_seller_comm            := NEW.seller_commission * NEW.vat_rate;
        NEW.vat_on_deferred_comm            := 0; -- مُضمَّنة داخل vat_on_buyer_comm أعلاه حسب القسم 2 من الوثيقة

        NEW.buyer_total := NEW.base_price + NEW.vat_on_base + NEW.buyer_commission
                          + NEW.deferred_commission + NEW.vat_on_buyer_comm;
        NEW.seller_net  := NEW.base_price + NEW.vat_on_base - NEW.seller_commission - NEW.vat_on_seller_comm;
    ELSE
        NEW.vat_rate         := s.vat_rate_standard;
        NEW.vat_on_base       := NEW.base_price * NEW.vat_rate;
        NEW.buyer_commission   := s.invare_commission_per_unit * NEW.quantity_kg;
        NEW.vat_on_buyer_comm    := NEW.buyer_commission * NEW.vat_rate;
        NEW.seller_commission     := s.invare_commission_per_unit * NEW.quantity_kg;
        NEW.vat_on_seller_comm      := NEW.seller_commission * NEW.vat_rate;
        NEW.deferred_commission      := 0;
        NEW.vat_on_deferred_comm       := 0;

        NEW.buyer_total := NEW.base_price + NEW.vat_on_base + NEW.buyer_commission + NEW.vat_on_buyer_comm;
        NEW.seller_net  := NEW.base_price + NEW.vat_on_base - NEW.seller_commission - NEW.vat_on_seller_comm;
    END IF;

    NEW.invare_profit := NEW.buyer_total - NEW.seller_net;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_commission_and_vat
    BEFORE INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_calculate_commission_and_vat();

-- =====================================================================
-- 9. نظام المحافظ المالية والفواتير (INVARE_WALLET_PRD.md v1.0)
-- =====================================================================
-- إنڤير وسيط: تشتري من البائع (تُضيف رصيده) وتبيع للمشتري (فاتورة ضريبية
-- باسمها). كل صفقة (= transactions.id هنا) تُنتج فاتورتين منفصلتين ولا
-- يُجمَّع بين الصفقات أبدًا. لا حاجة لجدول admins منفصل — أدوار الإدمن
-- (عام / مالي) هي قيم ضمن users.portal_role.
-- =====================================================================

-- 9.1 محفظة إنڤير المركزية (عمولة + ضريبة + رسوم — سجل واحد للمنصة كاملة)
CREATE TABLE invare_wallet (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_balance      NUMERIC(18,4) NOT NULL DEFAULT 0,
    available_balance  NUMERIC(18,4) NOT NULL DEFAULT 0,
    frozen_balance     NUMERIC(18,4) NOT NULL DEFAULT 0,
    currency           TEXT NOT NULL DEFAULT 'OMR',
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9.2 محافظ المستخدمين (منظمة واحدة = محفظة واحدة — يحل محل جدول wallets السابق)
CREATE TABLE user_wallets (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id    UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    total_balance      NUMERIC(18,4) NOT NULL DEFAULT 0,
    available_balance  NUMERIC(18,4) NOT NULL DEFAULT 0,
    frozen_balance     NUMERIC(18,4) NOT NULL DEFAULT 0,
    currency           TEXT NOT NULL DEFAULT 'OMR',
    status             wallet_status NOT NULL DEFAULT 'active',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_wallets_org ON user_wallets(organization_id);

-- 9.3 قيم الكربون لكل فئة مادة — تُستخدم في بنود الفواتير (القسم 5 من الوثيقة)
-- ⚠️ الجدول فارغ عمدًا: القيم المرجعية (IPCC أو دراسة محلية معتمدة) لم تُحسم
-- بعد لفئات Invare الفعلية (oil, plastic, metal, electronics, paper,
-- wood_organic) — لا تُدرَج قيم تقديرية غير موثّقة قبل اعتمادها من الأدمن العام.
CREATE TABLE carbon_values (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_category_id  SMALLINT NOT NULL UNIQUE REFERENCES material_categories(id),
    co2_per_kg            NUMERIC(10,4) NOT NULL,
    source                TEXT NOT NULL,           -- مرجع المعامل: IPCC / دراسة محلية...
    effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_by            UUID REFERENCES users(id),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9.4 الفواتير — صفقة واحدة (transactions.id) = فاتورتان بالضبط (بائع ومشترٍ)
CREATE TABLE invoices (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number        TEXT UNIQUE NOT NULL,     -- تسلسل تلقائي: TXN-YYYY-XXXXX
    type                  invoice_type NOT NULL,
    transaction_id        UUID NOT NULL REFERENCES transactions(id), -- يقابل "الصفقة/deal" في الوثيقة
    issued_by_org_id      UUID REFERENCES organizations(id),  -- NULL = إنڤير (طرف ثابت)
    issued_to_org_id      UUID REFERENCES organizations(id),  -- NULL = إنڤير (طرف ثابت)
    amount_subtotal       NUMERIC(18,4) NOT NULL,
    vat_amount             NUMERIC(18,4) NOT NULL DEFAULT 0,
    amount_total            NUMERIC(18,4) NOT NULL,
    total_co2_avoided_kg      NUMERIC(18,4) NOT NULL DEFAULT 0,
    currency                   TEXT NOT NULL DEFAULT 'OMR',
    status                      invoice_status NOT NULL DEFAULT 'draft',
    pdf_url                       VARCHAR,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(transaction_id, type)   -- يمنع تكرار فاتورة بائع أو مشترٍ لنفس الصفقة
);

CREATE INDEX idx_invoices_transaction ON invoices(transaction_id);
CREATE INDEX idx_invoices_status      ON invoices(status);

-- 9.5 بنود الفاتورة — سطر لكل مادة (حاليًا سطر واحد غالبًا لأن كل معاملة أحادية المادة)
CREATE TABLE invoice_items (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id             UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    material_category_id   SMALLINT NOT NULL REFERENCES material_categories(id),
    quantity_kg             NUMERIC(18,4) NOT NULL,
    unit_price               NUMERIC(18,4) NOT NULL,
    subtotal                   NUMERIC(18,4) NOT NULL,
    co2_per_kg                   NUMERIC(10,4) NOT NULL, -- منسوخة من carbon_values وقت الصفقة، مجمّدة لاحقًا
    co2_avoided_kg                 NUMERIC(18,4) NOT NULL -- = quantity_kg × co2_per_kg
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 9.6 جدول العمليات العام لكل محفظة مستخدم — سجل لا يُحذف منه أي سطر أبدًا
CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id       UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
    type            wallet_tx_type NOT NULL,
    direction       ledger_direction NOT NULL,
    amount          NUMERIC(18,4) NOT NULL CHECK (amount > 0),
    balance_before  NUMERIC(18,4),
    balance_after   NUMERIC(18,4),
    currency        TEXT NOT NULL DEFAULT 'OMR',
    status          wallet_tx_status NOT NULL DEFAULT 'pending',
    reason          TEXT,
    source_type     TEXT,               -- sale / auction / service / admin / card / deferred
    source_id       UUID,               -- عادة transactions.id
    source_url      VARCHAR,
    invoice_id      UUID REFERENCES invoices(id),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata        JSONB
);

CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_type   ON wallet_transactions(type);
CREATE INDEX idx_wallet_tx_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_tx_source ON wallet_transactions(source_type, source_id);

-- ---------------------------------------------------------------------
-- قيد صلب: تطبيق أثر كل عملية محفظة على الرصيد تلقائيًا (freeze/unfreeze
-- منفصلان عن credit/debit العاديين حسب مسار السحب في القسم 6.2 من الوثيقة)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_apply_wallet_transaction() RETURNS TRIGGER AS $$
DECLARE
    v_available NUMERIC(18,4);
    v_frozen    NUMERIC(18,4);
BEGIN
    SELECT available_balance, frozen_balance INTO v_available, v_frozen
    FROM user_wallets WHERE id = NEW.wallet_id FOR UPDATE;

    NEW.balance_before := v_available;

    IF NEW.type = 'freeze' THEN
        IF v_available < NEW.amount THEN
            RAISE EXCEPTION 'رصيد متاح غير كافٍ لتجميد % من المحفظة %', NEW.amount, NEW.wallet_id;
        END IF;
        v_available := v_available - NEW.amount;
        v_frozen    := v_frozen + NEW.amount;
    ELSIF NEW.type = 'unfreeze' THEN
        v_frozen    := v_frozen - NEW.amount;
        v_available := v_available + NEW.amount;
    ELSIF NEW.direction = 'credit' THEN
        v_available := v_available + NEW.amount;
    ELSE -- debit
        IF v_available < NEW.amount THEN
            RAISE EXCEPTION 'رصيد غير كافٍ للمحفظة %', NEW.wallet_id;
        END IF;
        v_available := v_available - NEW.amount;
    END IF;

    NEW.balance_after := v_available;

    UPDATE user_wallets
    SET available_balance = v_available,
        frozen_balance    = v_frozen,
        total_balance     = v_available + v_frozen,
        updated_at        = now()
    WHERE id = NEW.wallet_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_wallet_transaction
    BEFORE INSERT ON wallet_transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION fn_apply_wallet_transaction();

-- 9.7 طلبات السحب (القسم 6 من الوثيقة)
CREATE TABLE withdrawal_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    transaction_id       UUID REFERENCES transactions(id),
    amount                NUMERIC(18,4) NOT NULL CHECK (amount > 0),
    currency               TEXT NOT NULL DEFAULT 'OMR',
    bank_name                TEXT NOT NULL,
    account_number             TEXT NOT NULL,  -- يُشفَّر بالتطبيق قبل التخزين (pgcrypto متاح)
    iban                         TEXT NOT NULL,  -- يُشفَّر بالتطبيق قبل التخزين
    account_holder                 TEXT NOT NULL,
    phone                            TEXT NOT NULL,
    email                              TEXT NOT NULL,
    seller_invoice_id                    UUID NOT NULL REFERENCES invoices(id), -- إلزامية لقبول الطلب
    status                                 withdrawal_status NOT NULL DEFAULT 'pending',
    admin_id                                 UUID REFERENCES users(id),
    admin_note                                 TEXT,
    receipt_url                                  TEXT,
    created_at                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at                                     TIMESTAMPTZ
);

CREATE INDEX idx_withdrawal_org    ON withdrawal_requests(organization_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);

-- قيد صلب: حد أقصى 3 طلبات سحب شهريًا لكل منظمة (القسم 6.3 من الوثيقة)
CREATE OR REPLACE FUNCTION fn_check_withdrawal_monthly_limit() RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM withdrawal_requests
    WHERE organization_id = NEW.organization_id
      AND created_at >= date_trunc('month', CURRENT_DATE);

    IF v_count >= 3 THEN
        RAISE EXCEPTION 'تجاوزت الحد الأقصى لطلبات السحب (3 طلبات/شهر) للمنظمة %', NEW.organization_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_withdrawal_monthly_limit
    BEFORE INSERT ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION fn_check_withdrawal_monthly_limit();

-- 9.8 الإضافات والخصومات اليدوية من الأدمن (القسم 7 من الوثيقة)
CREATE TABLE admin_wallet_adjustments (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id              UUID NOT NULL REFERENCES user_wallets(id),
    admin_id               UUID NOT NULL REFERENCES users(id),
    type                   wallet_adj_type NOT NULL,
    amount                 NUMERIC(18,4) NOT NULL CHECK (amount > 0),
    currency               TEXT NOT NULL DEFAULT 'OMR',
    reason                 TEXT NOT NULL,
    receipt_url            TEXT NOT NULL,      -- إيصال بنكي إلزامي لكل إضافة يدوية
    reference_id           TEXT,
    wallet_transaction_id  UUID REFERENCES wallet_transactions(id), -- الأثر الفعلي على المحفظة
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_adj_wallet ON admin_wallet_adjustments(wallet_id);

-- =====================================================================
-- 10. التوزيع العادل بين المصانع (Round-Robin) والاعتراضات
-- =====================================================================

CREATE TABLE factory_allocations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factory_org_id      UUID NOT NULL REFERENCES organizations(id),
    collector_org_id    UUID NOT NULL REFERENCES organizations(id),
    cumulative_delivered_kg NUMERIC(14,3) NOT NULL DEFAULT 0,
    last_updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(factory_org_id, collector_org_id)
);

CREATE TABLE objections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factory_org_id      UUID NOT NULL REFERENCES organizations(id),
    collector_org_id    UUID NOT NULL REFERENCES organizations(id),
    transaction_id       UUID REFERENCES transactions(id),
    reason                TEXT NOT NULL,
    lab_test_result_url    TEXT,               -- دليل الفحص المخبري
    status                  objection_status NOT NULL DEFAULT 'pending',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at               TIMESTAMPTZ
);

-- الاعتراضات مرئية لكل المصانع والجهات الرقابية (لا حاجة لحقل خصوصية — تُقرأ عبر صلاحية البوابة)
CREATE INDEX idx_objections_collector ON objections(collector_org_id);

-- =====================================================================
-- 11. المخالفات والتنبيهات
-- =====================================================================

CREATE TABLE violations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id          UUID NOT NULL REFERENCES organizations(id),
    violation_type            TEXT NOT NULL,     -- 'مخالفة تسعير' / 'تعامل بدون تصريح' / 'تجاوز نطاق التغطية'
    description                TEXT,
    related_transaction_id      UUID REFERENCES transactions(id),
    status                       violation_status NOT NULL DEFAULT 'open',
    detected_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at                    TIMESTAMPTZ
);

CREATE INDEX idx_violations_org ON violations(organization_id);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    user_id         UUID REFERENCES users(id),
    type            TEXT NOT NULL,     -- 'permit_expiring' / 'new_offer' / 'objection_raised' ...
    message         TEXT NOT NULL,
    related_id      UUID,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_org  ON notifications(organization_id, is_read);

-- =====================================================================
-- 12. جاهزية ISCC — سلسلة العهدة، الموازنة الكتلية، التدقيقات
-- =====================================================================

-- 12.1 شهادات ISCC لكل منظمة (مجمّع أو مصنع)
CREATE TABLE iscc_certifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scheme                iscc_scheme NOT NULL,
    certificate_number      TEXT NOT NULL,
    certifying_body           TEXT NOT NULL,      -- TÜV / SGS / أخرى
    issue_date                 DATE NOT NULL,
    expiry_date                 DATE NOT NULL,
    status                       cert_status NOT NULL DEFAULT 'active',
    document_url                  TEXT,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, scheme, certificate_number)
);

CREATE INDEX idx_iscc_cert_org    ON iscc_certifications(organization_id);
CREATE INDEX idx_iscc_cert_expiry ON iscc_certifications(expiry_date);

-- 12.2 سلسلة العهدة لكل معاملة — تُعبّأ فقط للمعاملات المرشّحة للتصدير ضمن نطاق ISCC
CREATE TABLE iscc_chain_of_custody (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id                UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    custody_method                  mass_balance_type NOT NULL DEFAULT 'mass_balance',
    ghg_emission_kgco2e_per_ton       NUMERIC(10,3),
    ghg_reduction_percent               NUMERIC(5,2),   -- يجب >= 70% حسب متطلبات RED III
    pos_certificate_number                TEXT,          -- Proof of Sustainability
    waste_origin_declaration_url            TEXT,        -- إثبات مصدر النفاية
    is_export_eligible                        BOOLEAN NOT NULL DEFAULT false,
    created_at                                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_ghg_reduction CHECK (ghg_reduction_percent IS NULL OR ghg_reduction_percent >= 0)
);

-- 12.3 نقاط المصدر (Points of Origin) — تتبع حجم كل مولّد وتحديد هل يحتاج تدقيق (عتبة 5 طن/شهر)
CREATE TABLE point_of_origin_tracking (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generator_branch_id      UUID NOT NULL REFERENCES generator_branches(id) ON DELETE CASCADE,
    period_month              DATE NOT NULL,          -- أول يوم من الشهر المرجعي
    total_volume_kg              NUMERIC(12,3) NOT NULL DEFAULT 0,
    requires_audit                  BOOLEAN GENERATED ALWAYS AS (total_volume_kg >= 5000) STORED, -- عتبة ISCC: 5 طن/شهر
    last_audit_id                    UUID,
    created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(generator_branch_id, period_month)
);

CREATE INDEX idx_poo_requires_audit ON point_of_origin_tracking(requires_audit);

-- 12.4 التدقيقات (نقاط مصدر، نقاط تجميع، منتجين)
CREATE TABLE iscc_audits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id  UUID REFERENCES organizations(id),
    generator_branch_id UUID REFERENCES generator_branches(id), -- عند تدقيق نقطة مصدر تحديدًا
    audit_type        audit_type NOT NULL,
    audit_date          DATE NOT NULL,
    auditor_name          TEXT NOT NULL,
    result                  audit_result NOT NULL DEFAULT 'pending',
    report_url                TEXT,
    next_audit_due               DATE,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (organization_id IS NOT NULL OR generator_branch_id IS NOT NULL)
);

CREATE INDEX idx_iscc_audits_org    ON iscc_audits(organization_id);
CREATE INDEX idx_iscc_audits_branch ON iscc_audits(generator_branch_id);

-- ربط last_audit_id بعد إدراج التدقيق (تُنفَّذ من طبقة التطبيق أو Trigger اختياري)
ALTER TABLE point_of_origin_tracking
    ADD CONSTRAINT fk_poo_last_audit FOREIGN KEY (last_audit_id) REFERENCES iscc_audits(id);

-- 12.5 مؤشر الأثر البيئي (الكربون المتجنَّب) — يُستخدم في لوحة الجهات الرقابية وتقارير ISCC
CREATE TABLE carbon_impact_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id  UUID NOT NULL REFERENCES organizations(id),
    period_start       DATE NOT NULL,
    period_end           DATE NOT NULL,
    co2_avoided_kg          NUMERIC(14,3) NOT NULL,
    calculation_method        TEXT,   -- منهجية الحساب (RED III / ISCC LCA...)
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_carbon_org ON carbon_impact_log(organization_id);

-- =====================================================================
-- 13. سجل التدقيق العام للنظام (Audit Trail لبوابة الجهات الرقابية)
-- =====================================================================

CREATE TABLE system_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_user_id     UUID REFERENCES users(id),
    action              TEXT NOT NULL,       -- 'CREATE_TRANSACTION' / 'UPDATE_PERMIT' ...
    entity_table          TEXT NOT NULL,
    entity_id               UUID,
    details                    JSONB,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON system_audit_log(entity_table, entity_id);
CREATE INDEX idx_audit_log_actor  ON system_audit_log(actor_user_id);

-- =====================================================================
-- 14. Views جاهزة للوحات العرض (Dashboards)
-- =====================================================================

-- 14.1 المخزون الحالي لكل مجمّع (مشتريات - مبيعات)
CREATE OR REPLACE VIEW v_collector_current_stock AS
SELECT
    o.id AS collector_org_id,
    o.name_ar,
    mc.code AS material_code,
    COALESCE(SUM(CASE WHEN t.direction = 'purchase_from_generator' THEN t.quantity_kg ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.direction = 'sale_to_factory' THEN t.quantity_kg ELSE 0 END), 0) AS current_stock_kg
FROM organizations o
LEFT JOIN transactions t ON t.collector_org_id = o.id AND t.status = 'completed'
LEFT JOIN material_categories mc ON mc.id = t.material_category_id
WHERE o.org_type = 'collector'
GROUP BY o.id, o.name_ar, mc.code;

-- 14.2 حالة التصاريح القريبة من الانتهاء (تنبيه استباقي، افتراضي 30 يوم)
CREATE OR REPLACE VIEW v_permits_expiring_soon AS
SELECT p.*, o.name_ar, o.org_type
FROM permits p
JOIN organizations o ON o.id = p.organization_id
WHERE p.status = 'active'
  AND p.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days');

-- 14.3 لوحة إحصائيات عامة لبوابة الجهات الرقابية
CREATE OR REPLACE VIEW v_regulator_overview AS
SELECT
    (SELECT COUNT(*) FROM organizations WHERE org_type = 'collector' AND status = 'active') AS active_collectors,
    (SELECT COUNT(*) FROM organizations WHERE org_type = 'generator' AND status = 'active') AS active_generators,
    (SELECT COUNT(*) FROM organizations WHERE org_type = 'factory'   AND status = 'active') AS active_factories,
    (SELECT COUNT(*) FROM permits WHERE status = 'active') AS active_permits,
    (SELECT COUNT(*) FROM permits WHERE status = 'expired') AS expired_permits,
    (SELECT COUNT(*) FROM v_permits_expiring_soon) AS permits_expiring_soon,
    (SELECT COALESCE(SUM(co2_avoided_kg),0) FROM carbon_impact_log) AS total_co2_avoided_kg,
    (SELECT COUNT(*) FROM violations WHERE status = 'open') AS open_violations;

-- 14.4 جاهزية ISCC لكل مجمّع (نظرة سريعة لفريق Invare قبل التقديم للتصدير)
CREATE OR REPLACE VIEW v_iscc_readiness AS
SELECT
    o.id AS organization_id,
    o.name_ar,
    ic.scheme,
    ic.status AS certificate_status,
    ic.expiry_date,
    (SELECT COUNT(*) FROM iscc_audits a WHERE a.organization_id = o.id AND a.result = 'pass') AS passed_audits,
    (SELECT COUNT(*) FROM point_of_origin_tracking poo
        JOIN generator_branches gb ON gb.id = poo.generator_branch_id
        WHERE gb.generator_org_id = o.id AND poo.requires_audit = true AND poo.last_audit_id IS NULL) AS pending_required_audits
FROM organizations o
LEFT JOIN iscc_certifications ic ON ic.organization_id = o.id
WHERE o.org_type IN ('collector','factory');

-- 14.5 كشف حساب محفظة — أساس صفحة "كشف الحساب" لكل مستخدم (القسم 8.1 من وثيقة المحفظة)
CREATE OR REPLACE VIEW v_wallet_statement AS
SELECT
    wt.id,
    wt.wallet_id,
    o.id AS organization_id,
    o.name_ar AS organization_name,
    wt.type,
    wt.direction,
    wt.amount,
    wt.balance_after,
    wt.currency,
    wt.status,
    wt.source_type,
    wt.source_id,
    wt.source_url,
    wt.invoice_id,
    i.invoice_number,
    wt.created_at
FROM wallet_transactions wt
JOIN user_wallets uw ON uw.id = wt.wallet_id
JOIN organizations o ON o.id = uw.organization_id
LEFT JOIN invoices i ON i.id = wt.invoice_id
ORDER BY wt.created_at DESC;

-- =====================================================================
-- 15. دالة تحديث updated_at تلقائيًا (تُستخدم على كل الجداول المهمة)
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_organizations
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_touch_user_wallets
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_touch_invare_wallet
    BEFORE UPDATE ON invare_wallet
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

COMMIT;

-- =====================================================================
-- ملاحظات تنفيذية مهمة قبل الاستخدام في الإنتاج
-- =====================================================================
-- 1. عتبة تدقيق نقطة المصدر مضبوطة على 5000 كجم/شهر حسب دليل ISCC الرسمي (Waste & Residues Guidance).
--    إذا تغيّر الدليل مستقبلاً، عدّل الشرط في العمود requires_audit (يحتاج DROP + إعادة إنشاء العمود لأنه GENERATED).
-- 2. نسبة تخفيض الغازات الدفيئة (ghg_reduction_percent) يجب أن تكون >= 70% ليكون المصدر مؤهلاً للتصدير الأوروبي (RED III).
--    أضِف Trigger لاحقًا يمنع is_export_eligible = true إذا كانت النسبة أقل من 70.
-- 3. الجداول التالية لم تُبنَ بعد وتحتاج تصميمًا منفصلًا عند التنفيذ الفعلي (القسم 12 من التوثيق):
--    - مدة مهلة قبول العرض (response_deadline) — حاليًا حقل زمني حر، يحتاج قيمة افتراضية تُضبط من إعدادات النظام.
--    - معيار ترتيب priority_rank في request_offers — حاليًا حقل رقمي بدون منطق آلي مبرمج؛ يُحسب من طبقة التطبيق (المسافة/السعة/التناوب).
-- 4. جدول factory_allocations يُحدَّث عبر منطق تطبيقي (Backend) بعد كل معاملة sale_to_factory مكتملة،
--    لضمان تطبيق قاعدة "الأقل تراكمًا يُقدَّم أولاً" (القسم 8 من التوثيق).
-- 5. التوسّع لبقية فئات المواد (بلاستيك، معادن...) لا يحتاج تعديل بنيوي — الجداول مصممة بحياد عبر material_category_id.
-- =====================================================================
-- ملاحظات نظام المحفظة والفواتير (INVARE_WALLET_PRD.md v1.0) — نقاط قيد التحديد
-- =====================================================================
-- 6. carbon_values فارغ عمدًا: لا قيم CO2/كغ مُدرَجة لأي فئة مادة حتى الآن —
--    يحتاج اعتماد مصدر رسمي (IPCC أو دراسة محلية) من الأدمن العام قبل تفعيل حساب الكربون بالفواتير.
-- 7. [محدَّث يوليو 2026] عمولة المنصة وضريبة ق.م تُحسَب الآن تلقائيًا على transactions عبر
--    trg_calculate_commission_and_vat وجدول platform_settings (انظر database/INVARE_COMMISSION_TAX_LOGIC.md).
--    القيم الافتراضية (نسبة العمولة للوحدة، نِسَب الضريبة) غير نهائية وقابلة للتعديل من الأدمن العام فقط
--    (قسم 9.1 من وثيقة المحفظة). ما زال ناقصًا: Trigger يُدرِج تلقائيًا wallet_transactions من نوع
--    'commission' في invare_wallet عند اكتمال الصفقة (حاليًا invare_profit محسوب على السطر فقط، ولم يُربَط
--    بعد بعملية إيداع فعلية في invare_wallet — يحتاج Trigger AFTER UPDATE عند status = 'completed').
-- 8. عملة المنصة (OMR فقط أو OMR + SAR) لم تُحسم — الأعمدة currency جاهزة بصيغة TEXT حرة
--    لتفادي إعادة هيكلة لاحقة، لكن التطبيق يجب أن يمنع تعدد العملات داخل نفس المحفظة حتى يُحسم القرار.
-- 9. account_number و iban في withdrawal_requests نصّية عادية بالتصميم — التشفير الفعلي (pgcrypto
--    متاح كإضافة) يجب أن يُنفَّذ في طبقة الخدمة (service layer) قبل الإدراج، وليس عبر عمود مشفَّر مباشرة.
-- 10. جدول deals/deal_items المذكور في الوثيقة مقابله هنا transactions — كل transaction تمثّل "صفقة"
--     أحادية المادة؛ إذا احتاجت Invare مستقبلاً صفقات متعددة المواد دفعة واحدة فهذا يحتاج جدول deals
--     منفصل يجمع عدة transactions تحت مرجع واحد، بدل الاعتماد المباشر على transaction_id في invoices.
-- =====================================================================
