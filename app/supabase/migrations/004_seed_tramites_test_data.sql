-- ============================================
-- DATOS DE PRUEBA PARA MÓDULO DE TRÁMITES
-- ============================================
-- Este script inserta datos de prueba para visualizar el módulo de trámites
-- Ejecutar solo en ambiente de desarrollo

-- Primero, obtener el ID del status "Precalificación" y "Trámite Bancario"
DO $$
DECLARE
  v_precal_status_id UUID;
  v_tramite_status_id UUID;
  v_lead_id_1 UUID;
  v_lead_id_2 UUID;
  v_lead_id_3 UUID;
  v_lead_id_4 UUID;
  v_lead_id_5 UUID;
  v_lead_id_6 UUID;
BEGIN
  -- Obtener IDs de los estados
  SELECT id INTO v_precal_status_id FROM lead_statuses WHERE slug = 'precalificacion' LIMIT 1;
  SELECT id INTO v_tramite_status_id FROM lead_statuses WHERE slug = 'tramite_bancario' LIMIT 1;

  -- Si no existen los estados, salir
  IF v_precal_status_id IS NULL THEN
    RAISE NOTICE 'Estado precalificacion no encontrado';
    RETURN;
  END IF;

  -- ============================================
  -- CREAR LEADS DE PRUEBA CON CÉDULA
  -- ============================================

  -- Lead 1: En etapa APC
  INSERT INTO leads (first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('María', 'González', 'maria.gonzalez@email.com', '+507 6123-4567', '8-123-4567', v_precal_status_id, 'hot')
  RETURNING id INTO v_lead_id_1;

  -- Lead 2: En etapa verificación de ingresos
  INSERT INTO leads (first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Carlos', 'Rodríguez', 'carlos.rodriguez@email.com', '+507 6234-5678', '4-567-8901', v_precal_status_id, 'warm')
  RETURNING id INTO v_lead_id_2;

  -- Lead 3: En etapa precalificación bancaria
  INSERT INTO leads (first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Ana', 'Martínez', 'ana.martinez@email.com', '+507 6345-6789', '9-012-3456', v_tramite_status_id, 'hot')
  RETURNING id INTO v_lead_id_3;

  -- Lead 4: En etapa aprobación formal
  INSERT INTO leads (first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Roberto', 'Sánchez', 'roberto.sanchez@email.com', '+507 6456-7890', '7-890-1234', v_tramite_status_id, 'hot')
  RETURNING id INTO v_lead_id_4;

  -- Lead 5: Aprobado
  INSERT INTO leads (first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Laura', 'Pérez', 'laura.perez@email.com', '+507 6567-8901', '3-456-7890', v_tramite_status_id, 'hot')
  RETURNING id INTO v_lead_id_5;

  -- Lead 6: Rechazado
  INSERT INTO leads (first_name, last_name, email, phone, cedula, status_id, temperature)
  VALUES ('Pedro', 'López', 'pedro.lopez@email.com', '+507 6678-9012', '5-678-9012', v_precal_status_id, 'cold')
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

  RAISE NOTICE 'Datos de prueba para trámites insertados correctamente';
END $$;
