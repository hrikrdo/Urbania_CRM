-- ============================================
-- FIX CREDIT_CHECKS TABLE AND SEED DATA
-- ============================================
-- Esta migración asegura que la tabla credit_checks tenga todas las columnas
-- necesarias y luego inserta datos de prueba

-- PASO 1: Agregar columnas faltantes a credit_checks
-- ============================================
ALTER TABLE credit_checks ADD COLUMN IF NOT EXISTS prequalification_date TIMESTAMPTZ;
ALTER TABLE credit_checks ADD COLUMN IF NOT EXISTS prequalification_expires TIMESTAMPTZ;
ALTER TABLE credit_checks ADD COLUMN IF NOT EXISTS prequalification_notes TEXT;

-- Asegurar que la columna result tenga un default
ALTER TABLE credit_checks ALTER COLUMN result SET DEFAULT 'pending';

-- PASO 2: Crear índices para mejor performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_credit_checks_lead_id ON credit_checks(lead_id);
CREATE INDEX IF NOT EXISTS idx_credit_checks_result ON credit_checks(result);
CREATE INDEX IF NOT EXISTS idx_credit_checks_cedula ON credit_checks(cedula);

-- PASO 3: Habilitar RLS y crear políticas
-- ============================================
ALTER TABLE credit_checks ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can view credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Anyone can insert credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Anyone can update credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Anyone can delete credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Authenticated users can view credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Authenticated users can insert credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Authenticated users can update credit_checks" ON credit_checks;
DROP POLICY IF EXISTS "Authenticated users can delete credit_checks" ON credit_checks;

-- Crear políticas permisivas para desarrollo
CREATE POLICY "Authenticated users can view credit_checks" ON credit_checks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert credit_checks" ON credit_checks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update credit_checks" ON credit_checks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete credit_checks" ON credit_checks
  FOR DELETE TO authenticated USING (true);

-- PASO 4: Función para actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_credit_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_credit_checks_updated_at ON credit_checks;
CREATE TRIGGER trigger_credit_checks_updated_at
  BEFORE UPDATE ON credit_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_checks_updated_at();

-- ============================================
-- PASO 5: DATOS DE PRUEBA
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
  v_precal_status_id UUID;
  v_tramite_status_id UUID;
  v_lead_id_1 UUID;
  v_lead_id_2 UUID;
  v_lead_id_3 UUID;
  v_lead_id_4 UUID;
  v_lead_id_5 UUID;
  v_lead_id_6 UUID;
BEGIN
  -- Verificar si ya hay credit_checks
  SELECT COUNT(*) INTO v_count FROM credit_checks;

  IF v_count > 0 THEN
    RAISE NOTICE 'Ya existen % credit_checks, saltando datos de prueba', v_count;
    RETURN;
  END IF;

  -- Obtener IDs de los estados
  SELECT id INTO v_precal_status_id FROM lead_statuses WHERE slug = 'precalificacion' LIMIT 1;
  SELECT id INTO v_tramite_status_id FROM lead_statuses WHERE slug = 'tramite_bancario' LIMIT 1;

  -- Si no existen los estados, usar el primero disponible
  IF v_precal_status_id IS NULL THEN
    SELECT id INTO v_precal_status_id FROM lead_statuses LIMIT 1;
  END IF;

  IF v_tramite_status_id IS NULL THEN
    v_tramite_status_id := v_precal_status_id;
  END IF;

  IF v_precal_status_id IS NULL THEN
    RAISE NOTICE 'No hay estados de lead configurados, no se pueden crear datos de prueba';
    RETURN;
  END IF;

  -- ============================================
  -- CREAR LEADS DE PRUEBA CON CÉDULA
  -- ============================================
  -- Nota: Incluimos full_name para compatibilidad con esquemas que lo requieran

  -- Lead 1: En etapa APC
  INSERT INTO leads (full_name, first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('María González', 'María', 'González', 'maria.gonzalez.test@email.com', '+507 6123-4567', '8-123-4567', v_precal_status_id, 'hot')
  RETURNING id INTO v_lead_id_1;

  -- Lead 2: En etapa verificación de ingresos
  INSERT INTO leads (full_name, first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Carlos Rodríguez', 'Carlos', 'Rodríguez', 'carlos.rodriguez.test@email.com', '+507 6234-5678', '4-567-8901', v_precal_status_id, 'warm')
  RETURNING id INTO v_lead_id_2;

  -- Lead 3: En etapa precalificación bancaria
  INSERT INTO leads (full_name, first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Ana Martínez', 'Ana', 'Martínez', 'ana.martinez.test@email.com', '+507 6345-6789', '9-012-3456', v_tramite_status_id, 'hot')
  RETURNING id INTO v_lead_id_3;

  -- Lead 4: En etapa aprobación formal
  INSERT INTO leads (full_name, first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Roberto Sánchez', 'Roberto', 'Sánchez', 'roberto.sanchez.test@email.com', '+507 6456-7890', '7-890-1234', v_tramite_status_id, 'hot')
  RETURNING id INTO v_lead_id_4;

  -- Lead 5: Aprobado
  INSERT INTO leads (full_name, first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Laura Pérez', 'Laura', 'Pérez', 'laura.perez.test@email.com', '+507 6567-8901', '3-456-7890', v_tramite_status_id, 'hot')
  RETURNING id INTO v_lead_id_5;

  -- Lead 6: Rechazado
  INSERT INTO leads (full_name, first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Pedro López', 'Pedro', 'López', 'pedro.lopez.test@email.com', '+507 6678-9012', '5-678-9012', v_precal_status_id, 'cold')
  RETURNING id INTO v_lead_id_6;

  -- ============================================
  -- CREAR CREDIT CHECKS PARA CADA LEAD
  -- ============================================

  -- Credit Check 1: Solo pendiente APC
  INSERT INTO credit_checks (lead_id, cedula, result)
  VALUES (v_lead_id_1, '8-123-4567', 'pending');

  -- Credit Check 2: APC verificado, pendiente ingresos
  INSERT INTO credit_checks (lead_id, cedula, apc_status, apc_score, apc_verified_at, result)
  VALUES (v_lead_id_2, '4-567-8901', 'good', 720, NOW(), 'pending');

  -- Credit Check 3: APC e ingresos verificados, pendiente precalificación
  INSERT INTO credit_checks (
    lead_id, cedula,
    apc_status, apc_score, apc_verified_at,
    income_verified, monthly_income, employment_type, employer_name,
    result
  )
  VALUES (
    v_lead_id_3, '9-012-3456',
    'good', 750, NOW() - INTERVAL '2 days',
    true, 3500.00, 'employed', 'Empresa ABC S.A.',
    'pending'
  );

  -- Credit Check 4: Todo completo, pendiente aprobación formal
  INSERT INTO credit_checks (
    lead_id, cedula,
    apc_status, apc_score, apc_verified_at, apc_notes,
    income_verified, monthly_income, employment_type, employer_name,
    bank_name, prequalified, prequalified_amount, prequalified_rate, prequalified_term_months,
    estimated_monthly_payment, prequalification_date, prequalification_expires,
    result
  )
  VALUES (
    v_lead_id_4, '7-890-1234',
    'good', 780, NOW() - INTERVAL '5 days', 'Excelente historial crediticio',
    true, 4500.00, 'employed', 'Banco Nacional de Panamá',
    'Banco General', true, 150000.00, 6.5, 360,
    948.10, NOW() - INTERVAL '3 days', NOW() + INTERVAL '87 days',
    'pending'
  );

  -- Credit Check 5: Aprobado completamente
  INSERT INTO credit_checks (
    lead_id, cedula,
    apc_status, apc_score, apc_verified_at, apc_notes,
    income_verified, monthly_income, employment_type, employer_name,
    bank_name, prequalified, prequalified_amount, prequalified_rate, prequalified_term_months,
    estimated_monthly_payment, prequalification_date, prequalification_expires,
    formal_approval, formal_approval_date, formal_approval_amount, formal_approval_notes,
    result
  )
  VALUES (
    v_lead_id_5, '3-456-7890',
    'good', 800, NOW() - INTERVAL '10 days', 'Cliente preferencial',
    true, 5500.00, 'self_employed', 'Consultora Propia',
    'BAC Credomatic', true, 200000.00, 5.95, 360,
    1195.06, NOW() - INTERVAL '8 days', NOW() + INTERVAL '82 days',
    true, NOW() - INTERVAL '2 days', 200000.00, 'Aprobación rápida por buen perfil',
    'approved'
  );

  -- Credit Check 6: Rechazado por mal APC
  INSERT INTO credit_checks (
    lead_id, cedula,
    apc_status, apc_score, apc_verified_at, apc_notes,
    income_verified, monthly_income, employment_type, employer_name,
    result, rejection_reason
  )
  VALUES (
    v_lead_id_6, '5-678-9012',
    'bad', 480, NOW() - INTERVAL '3 days', 'Múltiples deudas en mora',
    true, 1500.00, 'employed', 'Restaurante El Sabor',
    'rejected', 'Score APC muy bajo y capacidad de pago insuficiente'
  );

  RAISE NOTICE '✓ Datos de prueba para trámites insertados correctamente (6 leads y 6 credit checks)';
END $$;
