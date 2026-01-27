-- ============================================
-- MIGRACIÓN 008: Arreglar tablas faltantes y relaciones
-- Fecha: 2026-01-26
-- ============================================

-- ============================================
-- 1. ARREGLAR FOREIGN KEY DE UNIT_TYPES
-- ============================================

-- Verificar si la FK ya existe, si no, crearla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unit_types_project_id_fkey'
    AND table_name = 'unit_types'
  ) THEN
    ALTER TABLE unit_types
    ADD CONSTRAINT unit_types_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. CREAR TABLA TEAMS (Para módulo Equipo)
-- ============================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREAR TABLA TEAM_MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'leader', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================
-- 4. CREAR TABLA LEAD_SOURCES (Fuentes de leads)
-- ============================================

CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50), -- 'digital', 'offline', 'referral'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar fuentes iniciales
INSERT INTO lead_sources (name, slug, category) VALUES
  ('Facebook Ads', 'facebook', 'digital'),
  ('Google Ads', 'google', 'digital'),
  ('Instagram', 'instagram', 'digital'),
  ('WhatsApp Directo', 'whatsapp', 'digital'),
  ('Página Web', 'website', 'digital'),
  ('Referido', 'referral', 'referral'),
  ('Walk-in', 'walkin', 'offline'),
  ('Llamada Entrante', 'inbound_call', 'offline'),
  ('Evento', 'event', 'offline'),
  ('Otro', 'other', 'offline')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. CREAR TABLA NOTES (Notas de leads)
-- ============================================

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_lead ON notes(lead_id, created_at DESC);

-- ============================================
-- 6. CREAR TABLA AD_SETS (Conjuntos de anuncios)
-- ============================================

CREATE TABLE IF NOT EXISTS ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  external_id VARCHAR(100),
  name VARCHAR(255),
  budget_daily DECIMAL(10, 2),
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. CREAR TABLA ADS (Anuncios individuales)
-- ============================================

CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  external_id VARCHAR(100),
  name VARCHAR(255),
  creative_url TEXT,
  headline VARCHAR(255),
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. CREAR TABLA KEYWORDS (Google Ads)
-- ============================================

CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  ad_set_id UUID REFERENCES ad_sets(id),
  keyword VARCHAR(255) NOT NULL,
  match_type VARCHAR(20), -- 'exact', 'phrase', 'broad'
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  cost_per_lead DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. CREAR TABLA ACHIEVEMENTS (Logros/Ticker)
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id),
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50) NOT NULL, -- 'reservation', 'sale', 'delivery', 'milestone'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_created ON achievements(created_at DESC);

-- ============================================
-- 10. HABILITAR RLS EN TODAS LAS TABLAS NUEVAS
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. POLÍTICAS RLS PARA DESARROLLO
-- ============================================

-- Teams
CREATE POLICY "Allow all on teams for authenticated" ON teams
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on teams for anon" ON teams
  FOR SELECT TO anon USING (true);

-- Team Members
CREATE POLICY "Allow all on team_members for authenticated" ON team_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on team_members for anon" ON team_members
  FOR SELECT TO anon USING (true);

-- Lead Sources
CREATE POLICY "Allow all on lead_sources for authenticated" ON lead_sources
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on lead_sources for anon" ON lead_sources
  FOR SELECT TO anon USING (true);

-- Notes
CREATE POLICY "Allow all on notes for authenticated" ON notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on notes for anon" ON notes
  FOR SELECT TO anon USING (true);

-- Ad Sets
CREATE POLICY "Allow all on ad_sets for authenticated" ON ad_sets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on ad_sets for anon" ON ad_sets
  FOR SELECT TO anon USING (true);

-- Ads
CREATE POLICY "Allow all on ads for authenticated" ON ads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on ads for anon" ON ads
  FOR SELECT TO anon USING (true);

-- Keywords
CREATE POLICY "Allow all on keywords for authenticated" ON keywords
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on keywords for anon" ON keywords
  FOR SELECT TO anon USING (true);

-- Achievements
CREATE POLICY "Allow all on achievements for authenticated" ON achievements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on achievements for anon" ON achievements
  FOR SELECT TO anon USING (true);

-- ============================================
-- 12. VERIFICAR/AGREGAR FK EN UNIT_TYPES SI FALTA COLUMNA
-- ============================================

-- Agregar columna project_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'unit_types' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE unit_types ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 13. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_teams_manager ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign ON ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaign ON ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_adset ON ads(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_keywords_campaign ON keywords(campaign_id);

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
