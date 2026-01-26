-- Urbania CRM - Migración de sincronización al esquema original
-- Esta migración transforma la BD actual al esquema del plan original

-- ============================================
-- PASO 1: Crear tablas base que faltan
-- ============================================

-- 1.1 Roles del sistema
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"all": true}'),
  ('gerente', '{"dashboard": true, "leads": true, "pool": true, "tramites": true, "inventario": true, "reservas": true, "marketing": true}'),
  ('vendedor', '{"leads": "own", "pool": true, "reservas": true}'),
  ('tramitador', '{"tramites": true, "pagos": true}'),
  ('marketing', '{"marketing": true}')
ON CONFLICT (name) DO NOTHING;

-- 1.2 Estados del lead
CREATE TABLE IF NOT EXISTS lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_transition_to UUID,
  auto_transition_hours INTEGER,
  module VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO lead_statuses (name, slug, position, color, module) VALUES
  ('Lead Entrante', 'lead_entrante', 1, '#3B82F6', 'comercial'),
  ('En Conversación', 'en_conversacion', 2, '#8B5CF6', 'comercial'),
  ('Precalificación', 'precalificacion', 3, '#F59E0B', 'tramites'),
  ('Cita Agendada', 'cita_agendada', 4, '#10B981', 'comercial'),
  ('Visita Realizada', 'visita_realizada', 5, '#06B6D4', 'comercial'),
  ('Reserva', 'reserva', 6, '#EC4899', 'inventario'),
  ('Trámite Bancario', 'tramite_bancario', 7, '#F97316', 'tramites'),
  ('Escrituración', 'escrituracion', 8, '#84CC16', 'cierre'),
  ('Entrega', 'entrega', 9, '#22C55E', 'cierre'),
  ('Post-Venta', 'postventa', 10, '#14B8A6', 'postventa'),
  ('Rechazado', 'rechazado', 99, '#EF4444', NULL),
  ('Pool Oportunidades', 'pool', 0, '#6B7280', 'pool')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PASO 2: Crear tabla users según plan original
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar datos de profiles a users
INSERT INTO users (id, first_name, last_name, email, phone, avatar_url, is_active, created_at, updated_at)
SELECT
  id,
  SPLIT_PART(full_name, ' ', 1) as first_name,
  SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1) as last_name,
  email,
  phone,
  avatar_url,
  active as is_active,
  created_at,
  updated_at
FROM profiles
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

-- Actualizar role_id basado en el campo role de profiles
UPDATE users u
SET role_id = r.id
FROM profiles p, roles r
WHERE u.id = p.id
AND (
  (p.role = 'director' AND r.name = 'admin') OR
  (p.role = 'gerente' AND r.name = 'gerente') OR
  (p.role = 'vendedor' AND r.name = 'vendedor') OR
  (p.role = 'tramitador' AND r.name = 'tramitador') OR
  (p.role = 'marketing' AND r.name = 'marketing')
);

-- ============================================
-- PASO 3: Actualizar tabla leads al esquema original
-- ============================================

-- Agregar columnas faltantes a leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS previous_assigned_to UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unit_type_preference UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_min DECIMAL(12, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_campaign_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_ad_id VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_adset_id VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_keyword VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chat_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature VARCHAR(20) DEFAULT 'cold';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pool_entered_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pool_claimed_by UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pool_claimed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attention_deadline TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attention_expired BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrar full_name a first_name/last_name
UPDATE leads
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = NULLIF(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1), '')
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Migrar current_stage a status_id
UPDATE leads l
SET status_id = ls.id
FROM lead_statuses ls
WHERE
  (l.current_stage = 'new' AND ls.slug = 'lead_entrante') OR
  (l.current_stage = 'contacted' AND ls.slug = 'en_conversacion') OR
  (l.current_stage = 'qualified' AND ls.slug = 'precalificacion') OR
  (l.current_stage = 'proposal' AND ls.slug = 'cita_agendada') OR
  (l.current_stage = 'negotiation' AND ls.slug = 'visita_realizada') OR
  (l.current_stage = 'won' AND ls.slug = 'entrega') OR
  (l.current_stage = 'lost' AND ls.slug = 'rechazado');

-- Si status_id sigue null, asignar lead_entrante por defecto
UPDATE leads
SET status_id = (SELECT id FROM lead_statuses WHERE slug = 'lead_entrante')
WHERE status_id IS NULL;

-- Migrar interest_level a temperature
UPDATE leads
SET temperature = interest_level
WHERE interest_level IS NOT NULL;

-- Migrar assigned_project_id a project_id
UPDATE leads
SET project_id = assigned_project_id
WHERE assigned_project_id IS NOT NULL AND project_id IS NULL;

-- Migrar marketing_source a source
UPDATE leads
SET source = marketing_source
WHERE marketing_source IS NOT NULL AND source IS NULL;

-- Migrar ai_score a lead_score
UPDATE leads
SET lead_score = ai_score
WHERE ai_score IS NOT NULL AND lead_score = 0;

-- ============================================
-- PASO 4: Actualizar tabla projects al esquema original
-- ============================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS available_units INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_from DECIMAL(12, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_to DECIMAL(12, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Migrar location a address
UPDATE projects
SET address = location
WHERE location IS NOT NULL AND address IS NULL;

-- Migrar features a amenities
UPDATE projects
SET amenities = features
WHERE features IS NOT NULL AND amenities = '[]';

-- ============================================
-- PASO 5: Crear tabla unit_types
-- ============================================

CREATE TABLE IF NOT EXISTS unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  area_m2 DECIMAL(8, 2),
  base_price DECIMAL(12, 2),
  floor_plan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASO 6: Actualizar tabla units al esquema original
-- ============================================

ALTER TABLE units ADD COLUMN IF NOT EXISTS unit_type_id UUID;
ALTER TABLE units ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE units ADD COLUMN IF NOT EXISTS view VARCHAR(100);
ALTER TABLE units ADD COLUMN IF NOT EXISTS area_m2 DECIMAL(8, 2);
ALTER TABLE units ADD COLUMN IF NOT EXISTS reserved_by UUID;
ALTER TABLE units ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- Renombrar columnas si existen con nombres diferentes
-- floor_number -> floor
UPDATE units SET floor = floor_number WHERE floor_number IS NOT NULL AND floor IS NULL;

-- area_sqm -> area_m2
UPDATE units SET area_m2 = area_sqm WHERE area_sqm IS NOT NULL AND area_m2 IS NULL;

-- reserved_by_lead_id -> reserved_by
UPDATE units SET reserved_by = reserved_by_lead_id WHERE reserved_by_lead_id IS NOT NULL AND reserved_by IS NULL;

-- ============================================
-- PASO 7: Crear tablas adicionales del plan original
-- ============================================

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  external_id VARCHAR(100),
  budget_daily DECIMAL(10, 2),
  budget_total DECIMAL(10, 2),
  budget_spent DECIMAL(10, 2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(10, 2),
  cost_per_conversion DECIMAL(10, 2),
  whatsapp_conversations INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit checks
CREATE TABLE IF NOT EXISTS credit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES users(id),
  cedula VARCHAR(20) NOT NULL,
  apc_status VARCHAR(20),
  apc_score INTEGER,
  apc_verified_at TIMESTAMPTZ,
  apc_notes TEXT,
  monthly_income DECIMAL(12, 2),
  income_verified BOOLEAN DEFAULT false,
  employment_type VARCHAR(50),
  employer_name VARCHAR(200),
  bank_name VARCHAR(100),
  prequalified BOOLEAN,
  prequalified_amount DECIMAL(12, 2),
  prequalified_rate DECIMAL(5, 2),
  prequalified_term_months INTEGER,
  estimated_monthly_payment DECIMAL(12, 2),
  prequalification_date TIMESTAMPTZ,
  prequalification_expires TIMESTAMPTZ,
  prequalification_notes TEXT,
  formal_approval BOOLEAN,
  formal_approval_date TIMESTAMPTZ,
  formal_approval_amount DECIMAL(12, 2),
  formal_approval_notes TEXT,
  result VARCHAR(20),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  unit_id UUID REFERENCES units(id),
  project_id UUID REFERENCES projects(id),
  unit_price DECIMAL(12, 2) NOT NULL,
  separation_amount DECIMAL(12, 2),
  initial_payment DECIMAL(12, 2),
  notary_costs DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'pending',
  separation_paid BOOLEAN DEFAULT false,
  separation_paid_at TIMESTAMPTZ,
  initial_payment_paid BOOLEAN DEFAULT false,
  initial_payment_paid_at TIMESTAMPTZ,
  bank_disbursement_amount DECIMAL(12, 2),
  bank_disbursement_date TIMESTAMPTZ,
  delivery_scheduled_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  delivery_notes TEXT,
  contract_url TEXT,
  deed_url TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  uploaded_by UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Sets
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ads
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

-- Keywords
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  ad_set_id UUID REFERENCES ad_sets(id),
  keyword VARCHAR(255) NOT NULL,
  match_type VARCHAR(20),
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  cost_per_lead DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (WhatsApp)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  whatsapp_conversation_id VARCHAR(100),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(100) UNIQUE,
  direction VARCHAR(10) NOT NULL,
  message_type VARCHAR(20) NOT NULL,
  content TEXT,
  media_url TEXT,
  media_mime_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  sent_by UUID REFERENCES users(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  language VARCHAR(10) DEFAULT 'es',
  content TEXT NOT NULL,
  variables JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  whatsapp_template_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASO 8: Crear índices
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_attention_deadline ON leads(attention_deadline) WHERE attention_expired = false;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- ============================================
-- PASO 9: Agregar constraint de FK para status_id
-- ============================================

-- Solo agregar si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_status_id_fkey'
    AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_status_id_fkey
    FOREIGN KEY (status_id) REFERENCES lead_statuses(id);
  END IF;
END $$;

-- ============================================
-- PASO 10: Funciones y Triggers
-- ============================================

-- Function to set attention deadline on lead creation
CREATE OR REPLACE FUNCTION public.set_lead_attention_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attention_deadline IS NULL THEN
    NEW.attention_deadline := NOW() + INTERVAL '60 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lead_deadline ON leads;
CREATE TRIGGER set_lead_deadline
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION public.set_lead_attention_deadline();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- PASO 11: Row Level Security
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies (create only if not exist)
DO $$
BEGIN
  -- Users policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all users' AND tablename = 'users') THEN
    CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
    CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Leads policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view leads' AND tablename = 'leads') THEN
    CREATE POLICY "Authenticated users can view leads" ON leads FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert leads' AND tablename = 'leads') THEN
    CREATE POLICY "Authenticated users can insert leads" ON leads FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update leads' AND tablename = 'leads') THEN
    CREATE POLICY "Authenticated users can update leads" ON leads FOR UPDATE TO authenticated USING (true);
  END IF;

  -- Projects policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view projects' AND tablename = 'projects') THEN
    CREATE POLICY "Authenticated users can view projects" ON projects FOR SELECT TO authenticated USING (true);
  END IF;

  -- Conversations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage conversations' AND tablename = 'conversations') THEN
    CREATE POLICY "Authenticated users can manage conversations" ON conversations FOR ALL TO authenticated USING (true);
  END IF;

  -- Messages policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view messages' AND tablename = 'messages') THEN
    CREATE POLICY "Authenticated users can view messages" ON messages FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert messages' AND tablename = 'messages') THEN
    CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  -- Activities policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view activities' AND tablename = 'activities') THEN
    CREATE POLICY "Authenticated users can view activities" ON activities FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert activities' AND tablename = 'activities') THEN
    CREATE POLICY "Authenticated users can insert activities" ON activities FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  -- Tasks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage tasks' AND tablename = 'tasks') THEN
    CREATE POLICY "Authenticated users can manage tasks" ON tasks FOR ALL TO authenticated USING (true);
  END IF;

  -- Appointments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage appointments' AND tablename = 'appointments') THEN
    CREATE POLICY "Authenticated users can manage appointments" ON appointments FOR ALL TO authenticated USING (true);
  END IF;

  -- Notifications policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- MIGRACIÓN COMPLETADA
-- ============================================
-- Esta migración sincroniza la BD actual con el esquema original del plan.
-- Los datos existentes en profiles, leads, projects y units han sido migrados.
