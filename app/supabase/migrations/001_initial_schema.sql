-- Urbania CRM - Initial Database Schema
-- PASO 1: Ejecutar primero las tablas sin dependencias

-- 1. Roles del sistema
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"all": true}'),
  ('gerente', '{"dashboard": true, "leads": true, "pool": true, "tramites": true, "inventario": true, "reservas": true, "marketing": true}'),
  ('vendedor', '{"leads": "own", "pool": true, "reservas": true}'),
  ('tramitador', '{"tramites": true, "pagos": true}'),
  ('marketing', '{"marketing": true}')
ON CONFLICT (name) DO NOTHING;

-- 2. Estados del lead (sin auto_transition_to por ahora)
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

-- Insert default statuses
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

-- Agregar FK después de crear la tabla
ALTER TABLE lead_statuses
ADD CONSTRAINT fk_auto_transition
FOREIGN KEY (auto_transition_to) REFERENCES lead_statuses(id);

-- 3. Proyectos inmobiliarios
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  total_units INTEGER DEFAULT 0,
  available_units INTEGER DEFAULT 0,
  price_from DECIMAL(12, 2),
  price_to DECIMAL(12, 2),
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tipos de unidades
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

-- 5. Campañas (antes de leads)
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

-- 6. Usuarios (extiende auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Equipos de ventas
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

-- 8. Leads (tabla principal)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  phone_secondary VARCHAR(20),
  cedula VARCHAR(20),
  status_id UUID NOT NULL REFERENCES lead_statuses(id),
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  previous_assigned_to UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  unit_type_preference UUID REFERENCES unit_types(id),
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  source VARCHAR(50),
  source_campaign_id UUID REFERENCES campaigns(id),
  source_ad_id VARCHAR(100),
  source_adset_id VARCHAR(100),
  source_keyword VARCHAR(255),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  call_attempts INTEGER DEFAULT 0,
  chat_attempts INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,
  lead_score INTEGER DEFAULT 0,
  temperature VARCHAR(20) DEFAULT 'cold',
  pool_entered_at TIMESTAMPTZ,
  pool_claimed_by UUID REFERENCES users(id),
  pool_claimed_at TIMESTAMPTZ,
  attention_deadline TIMESTAMPTZ,
  attention_expired BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_attention_deadline ON leads(attention_deadline) WHERE attention_expired = false;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- 9. Unidades (inventario)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id),
  unit_number VARCHAR(20) NOT NULL,
  floor INTEGER,
  view VARCHAR(100),
  area_m2 DECIMAL(8, 2),
  price DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  reserved_by UUID REFERENCES leads(id),
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, unit_number)
);

-- 10. Actividades
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'call_outbound', 'call_inbound', 'call_missed',
    'whatsapp_sent', 'whatsapp_received',
    'email_sent', 'email_received',
    'meeting_scheduled', 'meeting_completed', 'meeting_cancelled',
    'note_added', 'document_uploaded',
    'status_changed', 'assignment_changed',
    'reservation_created', 'payment_received',
    'system_notification'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type activity_type NOT NULL,
  title VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id, created_at DESC);

-- 11. Tareas
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

-- 12. Verificaciones de crédito
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

-- 13. Reservas
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

-- 14. Pagos
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

-- 15. Citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  location TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  client_confirmed BOOLEAN,
  client_confirmed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'scheduled',
  attended BOOLEAN,
  outcome TEXT,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AdSets
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

-- 17. Ads
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

-- 18. Keywords
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

-- 19. Documentos
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

-- 20. Notificaciones
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

-- 21. Logros (ticker)
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

-- 22. Conversaciones WhatsApp
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

CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);

-- 23. Mensajes WhatsApp
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

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- 24. Plantillas de mensajes
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
-- ROW LEVEL SECURITY (RLS)
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

-- Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policies for leads (authenticated users can access)
CREATE POLICY "Authenticated users can view leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE TO authenticated USING (true);

-- Policies for projects (all authenticated can view)
CREATE POLICY "Authenticated users can view projects" ON projects
  FOR SELECT TO authenticated USING (true);

-- Policies for conversations
CREATE POLICY "Authenticated users can view conversations" ON conversations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage conversations" ON conversations
  FOR ALL TO authenticated USING (true);

-- Policies for messages
CREATE POLICY "Authenticated users can view messages" ON messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for activities
CREATE POLICY "Authenticated users can view activities" ON activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activities" ON activities
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for tasks
CREATE POLICY "Authenticated users can manage tasks" ON tasks
  FOR ALL TO authenticated USING (true);

-- Policies for appointments
CREATE POLICY "Authenticated users can manage appointments" ON appointments
  FOR ALL TO authenticated USING (true);

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Add updated_at triggers to relevant tables
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
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
