-- ============================================
-- MIGRATION 007: APPOINTMENTS, CAMPAIGNS, RESERVATIONS, PAYMENTS
-- ============================================
-- Esta migración crea las tablas necesarias para:
-- - Módulo de Agenda (appointments)
-- - Módulo de Marketing (campaigns)
-- - Módulo de Cierre (reservations, payments)

-- ============================================
-- LIMPIAR TABLAS EXISTENTES (por si hay versiones parciales)
-- ============================================
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- ============================================
-- TABLA: APPOINTMENTS (Citas y Visitas)
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),

  -- Tipo y detalles
  type VARCHAR(50) NOT NULL DEFAULT 'visit', -- 'visit', 'call', 'video_call', 'meeting', 'follow_up'
  title VARCHAR(255),
  description TEXT,
  location TEXT,
  meeting_link TEXT,

  -- Programación
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- Confirmaciones
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  client_confirmed BOOLEAN,
  client_confirmed_at TIMESTAMPTZ,

  -- Estado y resultado
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
  attended BOOLEAN,
  outcome VARCHAR(50), -- 'interested', 'not_interested', 'needs_follow_up', 'reserved', 'other'
  outcome_notes TEXT,
  follow_up_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON appointments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_project_id ON appointments(project_id);

-- RLS para appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON appointments;

CREATE POLICY "Authenticated users can view appointments" ON appointments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert appointments" ON appointments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments" ON appointments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete appointments" ON appointments
  FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();


-- ============================================
-- TABLA: CAMPAIGNS (Campañas de Marketing)
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),

  -- Información básica
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'google', 'instagram', 'tiktok'
  external_id VARCHAR(100), -- ID en la plataforma externa

  -- Presupuesto
  budget_daily DECIMAL(10, 2),
  budget_total DECIMAL(10, 2),
  budget_spent DECIMAL(10, 2) DEFAULT 0,

  -- Métricas (actualizadas via API)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(10, 2),
  cost_per_conversion DECIMAL(10, 2),

  -- WhatsApp específico
  whatsapp_conversations INTEGER DEFAULT 0,

  -- Estado y fechas
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
  start_date DATE,
  end_date DATE,

  -- Sincronización
  last_sync_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_external_id ON campaigns(external_id);

-- RLS para campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON campaigns;

CREATE POLICY "Authenticated users can view campaigns" ON campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert campaigns" ON campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns" ON campaigns
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete campaigns" ON campaigns
  FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_campaigns_updated_at ON campaigns;
CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();


-- ============================================
-- TABLA: RESERVATIONS (Reservas de Unidades)
-- ============================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  unit_id UUID REFERENCES units(id),
  project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES users(id),

  -- Precios
  unit_price DECIMAL(12, 2) NOT NULL,
  separation_amount DECIMAL(12, 2), -- Monto de separación
  initial_payment DECIMAL(12, 2), -- Abono inicial
  notary_costs DECIMAL(12, 2), -- Costos de escritura

  -- Estados de pago
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  separation_paid BOOLEAN DEFAULT false,
  separation_paid_at TIMESTAMPTZ,
  initial_payment_paid BOOLEAN DEFAULT false,
  initial_payment_paid_at TIMESTAMPTZ,

  -- Desembolso bancario
  bank_disbursement_amount DECIMAL(12, 2),
  bank_disbursement_date TIMESTAMPTZ,

  -- Entrega
  delivery_scheduled_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  delivery_notes TEXT,

  -- Documentos
  contract_url TEXT,
  deed_url TEXT,

  -- Cancelación
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para reservations
CREATE INDEX IF NOT EXISTS idx_reservations_lead_id ON reservations(lead_id);
CREATE INDEX IF NOT EXISTS idx_reservations_unit_id ON reservations(unit_id);
CREATE INDEX IF NOT EXISTS idx_reservations_project_id ON reservations(project_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- RLS para reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can update reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON reservations;

CREATE POLICY "Authenticated users can view reservations" ON reservations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert reservations" ON reservations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update reservations" ON reservations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete reservations" ON reservations
  FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON reservations;
CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();


-- ============================================
-- TABLA: PAYMENTS (Pagos)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  recorded_by UUID REFERENCES users(id),

  -- Tipo y monto
  type VARCHAR(50) NOT NULL, -- 'separation', 'initial', 'monthly', 'notary', 'disbursement', 'other'
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50), -- 'transfer', 'check', 'cash', 'financing'
  reference_number VARCHAR(100),

  -- Estado
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,

  -- Notas y comprobante
  notes TEXT,
  receipt_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON payments;

CREATE POLICY "Authenticated users can view payments" ON payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments" ON payments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete payments" ON payments
  FOR DELETE TO authenticated USING (true);


-- ============================================
-- DATOS DE PRUEBA
-- ============================================

DO $$
DECLARE
  v_project_id UUID;
  v_lead_id UUID;
  v_unit_id UUID;
  v_user_id UUID;
BEGIN
  -- Obtener un proyecto existente
  SELECT id INTO v_project_id FROM projects LIMIT 1;

  -- Obtener un lead existente
  SELECT id INTO v_lead_id FROM leads LIMIT 1;

  -- Obtener una unidad existente
  SELECT id INTO v_unit_id FROM units WHERE status = 'available' LIMIT 1;

  -- Obtener un usuario existente
  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- Solo insertar datos si tenemos las referencias necesarias
  IF v_project_id IS NOT NULL AND v_lead_id IS NOT NULL THEN
    -- Insertar campañas de prueba si no existen
    IF NOT EXISTS (SELECT 1 FROM campaigns LIMIT 1) THEN
      INSERT INTO campaigns (name, platform, project_id, budget_daily, budget_total, budget_spent, impressions, clicks, leads_count, conversions, status, start_date)
      VALUES
        ('Campaña Facebook - Torre Marina', 'facebook', v_project_id, 50.00, 1500.00, 450.00, 25000, 850, 45, 12, 'active', CURRENT_DATE - INTERVAL '15 days'),
        ('Google Ads - Apartamentos Centro', 'google', v_project_id, 75.00, 2250.00, 890.00, 18000, 620, 38, 8, 'active', CURRENT_DATE - INTERVAL '20 days'),
        ('Instagram Stories - Promoción', 'instagram', v_project_id, 30.00, 900.00, 300.00, 35000, 1200, 28, 5, 'paused', CURRENT_DATE - INTERVAL '10 days'),
        ('TikTok - Jóvenes Profesionales', 'tiktok', v_project_id, 25.00, 750.00, 200.00, 50000, 1500, 15, 2, 'active', CURRENT_DATE - INTERVAL '5 days');

      RAISE NOTICE '✓ Campañas de marketing insertadas correctamente';
    END IF;

    -- Insertar citas de prueba si no existen
    IF NOT EXISTS (SELECT 1 FROM appointments LIMIT 1) THEN
      INSERT INTO appointments (lead_id, project_id, assigned_to, type, title, scheduled_at, duration_minutes, status)
      VALUES
        (v_lead_id, v_project_id, v_user_id, 'visit', 'Visita a sala de ventas', NOW() + INTERVAL '2 days', 60, 'scheduled'),
        (v_lead_id, v_project_id, v_user_id, 'call', 'Llamada de seguimiento', NOW() + INTERVAL '1 day', 30, 'confirmed'),
        (v_lead_id, v_project_id, v_user_id, 'video_call', 'Presentación virtual', NOW() - INTERVAL '3 days', 45, 'completed'),
        (v_lead_id, v_project_id, v_user_id, 'meeting', 'Reunión con cotización', NOW() - INTERVAL '5 days', 90, 'completed');

      -- Actualizar las citas completadas con resultado
      UPDATE appointments SET attended = true, outcome = 'interested', outcome_notes = 'Cliente muy interesado en modelo de 2 recámaras'
      WHERE status = 'completed' AND lead_id = v_lead_id;

      RAISE NOTICE '✓ Citas de prueba insertadas correctamente';
    END IF;

    -- Insertar reserva de prueba si hay unidad disponible
    IF v_unit_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservations LIMIT 1) THEN
      INSERT INTO reservations (lead_id, unit_id, project_id, created_by, unit_price, separation_amount, initial_payment, status)
      VALUES (v_lead_id, v_unit_id, v_project_id, v_user_id, 150000.00, 1000.00, 15000.00, 'pending');

      RAISE NOTICE '✓ Reserva de prueba insertada correctamente';
    END IF;
  ELSE
    RAISE NOTICE 'No se encontraron proyectos o leads para crear datos de prueba';
  END IF;
  RAISE NOTICE '✓ Migración 007 completada: appointments, campaigns, reservations, payments';
END $$;
