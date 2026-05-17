-- ============================================================
-- SPONSOR PAYMENT & DASHBOARD SYSTEM
-- ============================================================

-- 1. Sponsor users (extends auth.users for sponsor role)
CREATE TABLE IF NOT EXISTS sponsor_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscription packages
CREATE TABLE IF NOT EXISTS sponsor_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  max_offers INTEGER NOT NULL,
  features_en JSONB DEFAULT '[]',
  features_ar JSONB DEFAULT '[]',
  popular BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions (tracks payments + status)
CREATE TABLE IF NOT EXISTS sponsor_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  package_id UUID REFERENCES sponsor_packages(id),
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('whish', 'omt', 'usdt')),
  payment_proof_url TEXT,
  payment_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sponsor offers (discounts/gifts stores create)
CREATE TABLE IF NOT EXISTS sponsor_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('percentage', 'fixed', 'gift', 'bogo')),
  discount_value NUMERIC, -- for percentage/fixed
  points_required INTEGER NOT NULL,
  code_prefix TEXT NOT NULL,
  max_redemptions INTEGER DEFAULT 0, -- 0 = unlimited
  redemption_count INTEGER DEFAULT 0,
  image_url TEXT,
  terms_en TEXT,
  terms_ar TEXT,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User redemptions
CREATE TABLE IF NOT EXISTS offer_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES sponsor_offers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sponsor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Packages are public" ON sponsor_packages FOR SELECT USING (TRUE);

CREATE POLICY "Sponsor users can read own" ON sponsor_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage sponsor_users" ON sponsor_users FOR ALL USING (auth.uid() IN (SELECT user_id FROM sponsor_users WHERE role='owner'));

CREATE POLICY "Sponsors read own subscriptions" ON sponsor_subscriptions FOR SELECT USING (sponsor_id IN (SELECT sponsor_id FROM sponsor_users WHERE user_id = auth.uid()));
CREATE POLICY "Sponsors insert own subscriptions" ON sponsor_subscriptions FOR INSERT WITH CHECK (sponsor_id IN (SELECT sponsor_id FROM sponsor_users WHERE user_id = auth.uid()));
CREATE POLICY "Admin manage subscriptions" ON sponsor_subscriptions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Sponsors read own offers" ON sponsor_offers FOR SELECT USING (sponsor_id IN (SELECT sponsor_id FROM sponsor_users WHERE user_id = auth.uid()));
CREATE POLICY "Sponsors manage own offers" ON sponsor_offers FOR ALL USING (sponsor_id IN (SELECT sponsor_id FROM sponsor_users WHERE user_id = auth.uid()));
CREATE POLICY "Users read active offers" ON sponsor_offers FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins manage all offers" ON sponsor_offers FOR ALL USING (auth.uid() IN (SELECT user_id FROM sponsor_users WHERE role='owner'));

CREATE POLICY "Users read own redemptions" ON offer_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own redemptions" ON offer_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sponsors read redemptions for own offers" ON offer_redemptions FOR SELECT USING (offer_id IN (SELECT id FROM sponsor_offers WHERE sponsor_id IN (SELECT sponsor_id FROM sponsor_users WHERE user_id = auth.uid())));
CREATE POLICY "Sponsors update redemptions for own offers" ON offer_redemptions FOR UPDATE USING (offer_id IN (SELECT id FROM sponsor_offers WHERE sponsor_id IN (SELECT sponsor_id FROM sponsor_users WHERE user_id = auth.uid())));

-- Seed packages
INSERT INTO sponsor_packages (name_en, name_ar, price_usd, duration_days, max_offers, features_en, features_ar, popular) VALUES
('Starter', ' starter', 50, 30, 3,
  '["Up to 3 active offers", "Basic analytics", "Email support"]'::jsonb,
  '["حتى 3 عروض نشطة", "إحصائيات أساسية", "دعم عبر البريد"]'::jsonb,
  FALSE),
('Pro', 'المتقدم', 100, 30, 10,
  '["Up to 10 active offers", "Full analytics dashboard", "Priority support", "Featured placement"]'::jsonb,
  '["حتى 10 عروض نشطة", "لوحة إحصائيات كاملة", "دعم أولوي", "ظهور مميز"]'::jsonb,
  TRUE),
('Premium', 'البريميوم', 200, 30, 9999,
  '["Unlimited offers", "Full analytics dashboard", "VIP support", "Featured placement", "Dedicated account manager", "Custom branding"]'::jsonb,
  '["عروض غير محدودة", "لوحة إحصائيات كاملة", "دعم VIP", "ظهور مميز", "مدير حساب مخصص", "علامة تجارية مخصصة"]'::jsonb,
  FALSE)
ON CONFLICT DO NOTHING;

-- Create storage bucket for payment proofs (run in SQL Editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('sponsor-payments', 'sponsor-payments', true)
-- ON CONFLICT (id) DO NOTHING;
