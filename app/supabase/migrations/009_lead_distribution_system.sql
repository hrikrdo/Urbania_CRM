-- ============================================
-- LEAD DISTRIBUTION SYSTEM
-- ============================================
-- This migration adds:
-- 1. user_projects: Relationship between sales reps and projects
-- 2. lead_assignment_history: Full history of lead assignments
-- 3. Functions for round-robin assignment
-- 4. Automatic pool transition for expired leads
-- ============================================

-- 1. USER_PROJECTS TABLE
-- Links sales reps to projects they can sell
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_assigned_at TIMESTAMPTZ,
  leads_assigned_today INT DEFAULT 0,
  max_leads_per_day INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_projects_project ON user_projects(project_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id) WHERE is_active = true;

-- 2. LEAD_ASSIGNMENT_HISTORY TABLE
-- Tracks every assignment, expiration, and pool claim
CREATE TABLE IF NOT EXISTS lead_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'assigned', 'expired', 'claimed', 'returned', 'contacted'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expired_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  status_changed_to VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for history lookups
CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON lead_assignment_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_user ON lead_assignment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_action ON lead_assignment_history(action);

-- 3. FUNCTION: Get next available sales rep for a project (Round Robin)
CREATE OR REPLACE FUNCTION get_next_sales_rep(p_project_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find the sales rep with:
  -- 1. Active assignment to this project
  -- 2. Under their daily limit
  -- 3. Ordered by: least leads today, then oldest last assignment
  SELECT up.user_id INTO v_user_id
  FROM user_projects up
  JOIN users u ON u.id = up.user_id
  WHERE up.project_id = p_project_id
    AND up.is_active = true
    AND u.is_active = true
    AND up.leads_assigned_today < up.max_leads_per_day
  ORDER BY
    up.leads_assigned_today ASC,
    up.last_assigned_at ASC NULLS FIRST
  LIMIT 1;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNCTION: Assign lead to sales rep
CREATE OR REPLACE FUNCTION assign_lead_to_rep(
  p_lead_id UUID,
  p_user_id UUID,
  p_action VARCHAR DEFAULT 'assigned'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Get lead's project
  SELECT project_id INTO v_project_id FROM leads WHERE id = p_lead_id;

  -- Calculate deadline (1 hour from now)
  v_deadline := NOW() + INTERVAL '1 hour';

  -- Update lead
  UPDATE leads SET
    assigned_to = p_user_id,
    assigned_at = NOW(),
    attention_deadline = v_deadline,
    attention_expired = false,
    pool_entered_at = NULL,
    pool_claimed_by = CASE WHEN p_action = 'claimed' THEN p_user_id ELSE pool_claimed_by END,
    pool_claimed_at = CASE WHEN p_action = 'claimed' THEN NOW() ELSE pool_claimed_at END,
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- Update user_projects counters
  IF v_project_id IS NOT NULL THEN
    UPDATE user_projects SET
      last_assigned_at = NOW(),
      leads_assigned_today = leads_assigned_today + 1
    WHERE user_id = p_user_id AND project_id = v_project_id;
  END IF;

  -- Record in history
  INSERT INTO lead_assignment_history (lead_id, user_id, action, assigned_at)
  VALUES (p_lead_id, p_user_id, p_action, NOW());

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNCTION: Auto-assign new lead
CREATE OR REPLACE FUNCTION auto_assign_lead(p_lead_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
  v_user_id UUID;
  v_pool_status_id UUID;
BEGIN
  -- Get lead's project
  SELECT project_id INTO v_project_id FROM leads WHERE id = p_lead_id;

  -- If no project, go to pool
  IF v_project_id IS NULL THEN
    -- Get pool status
    SELECT id INTO v_pool_status_id FROM lead_statuses WHERE slug = 'pool' LIMIT 1;

    UPDATE leads SET
      pool_entered_at = NOW(),
      attention_expired = true,
      updated_at = NOW()
    WHERE id = p_lead_id;

    INSERT INTO lead_assignment_history (lead_id, action, notes)
    VALUES (p_lead_id, 'to_pool', 'No project assigned');

    RETURN NULL;
  END IF;

  -- Get next available sales rep
  v_user_id := get_next_sales_rep(v_project_id);

  -- If no rep available, go to pool
  IF v_user_id IS NULL THEN
    SELECT id INTO v_pool_status_id FROM lead_statuses WHERE slug = 'pool' LIMIT 1;

    UPDATE leads SET
      pool_entered_at = NOW(),
      attention_expired = true,
      updated_at = NOW()
    WHERE id = p_lead_id;

    INSERT INTO lead_assignment_history (lead_id, action, notes)
    VALUES (p_lead_id, 'to_pool', 'No available sales reps for project');

    RETURN NULL;
  END IF;

  -- Assign the lead
  PERFORM assign_lead_to_rep(p_lead_id, v_user_id, 'assigned');

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCTION: Move expired leads to pool
CREATE OR REPLACE FUNCTION expire_unattended_leads()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_lead RECORD;
  v_pool_status_id UUID;
BEGIN
  -- Get pool status
  SELECT id INTO v_pool_status_id FROM lead_statuses WHERE slug = 'pool' LIMIT 1;

  -- Find and process expired leads
  FOR v_lead IN
    SELECT id, assigned_to
    FROM leads
    WHERE attention_deadline < NOW()
      AND attention_expired = false
      AND assigned_to IS NOT NULL
  LOOP
    -- Record expiration in history
    INSERT INTO lead_assignment_history (lead_id, user_id, action, expired_at)
    VALUES (v_lead.id, v_lead.assigned_to, 'expired', NOW());

    -- Move to pool
    UPDATE leads SET
      previous_assigned_to = assigned_to,
      assigned_to = NULL,
      attention_expired = true,
      pool_entered_at = NOW(),
      status_id = COALESCE(v_pool_status_id, status_id),
      updated_at = NOW()
    WHERE id = v_lead.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCTION: Claim lead from pool
CREATE OR REPLACE FUNCTION claim_lead_from_pool(
  p_lead_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
  v_has_access BOOLEAN;
BEGIN
  -- Get lead's project
  SELECT project_id INTO v_project_id FROM leads WHERE id = p_lead_id;

  -- Check if user has access to this project (if project exists)
  IF v_project_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_projects
      WHERE user_id = p_user_id
        AND project_id = v_project_id
        AND is_active = true
    ) INTO v_has_access;

    IF NOT v_has_access THEN
      RAISE EXCEPTION 'User does not have access to this project';
    END IF;
  END IF;

  -- Assign using the standard function
  PERFORM assign_lead_to_rep(p_lead_id, p_user_id, 'claimed');

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCTION: Record lead contact (stops the timer)
CREATE OR REPLACE FUNCTION record_lead_contact(
  p_lead_id UUID,
  p_user_id UUID,
  p_new_status_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update lead
  UPDATE leads SET
    attention_expired = false,
    attention_deadline = NULL,
    last_contact_at = NOW(),
    status_id = COALESCE(p_new_status_id, status_id),
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- Record in history
  INSERT INTO lead_assignment_history (
    lead_id,
    user_id,
    action,
    contacted_at,
    status_changed_to
  )
  SELECT
    p_lead_id,
    p_user_id,
    'contacted',
    NOW(),
    ls.name
  FROM lead_statuses ls
  WHERE ls.id = COALESCE(p_new_status_id, (SELECT status_id FROM leads WHERE id = p_lead_id));

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCTION: Reset daily counters (run at midnight)
CREATE OR REPLACE FUNCTION reset_daily_lead_counters()
RETURNS VOID AS $$
BEGIN
  UPDATE user_projects SET leads_assigned_today = 0;
END;
$$ LANGUAGE plpgsql;

-- 10. VIEW: Lead assignment summary
CREATE OR REPLACE VIEW lead_assignment_summary AS
SELECT
  l.id as lead_id,
  l.first_name || ' ' || COALESCE(l.last_name, '') as lead_name,
  l.project_id,
  p.name as project_name,
  l.assigned_to,
  u.first_name || ' ' || COALESCE(u.last_name, '') as assigned_to_name,
  l.assigned_at,
  l.attention_deadline,
  l.attention_expired,
  l.pool_entered_at,
  CASE
    WHEN l.attention_deadline IS NOT NULL AND l.attention_deadline > NOW()
    THEN EXTRACT(EPOCH FROM (l.attention_deadline - NOW())) / 60
    ELSE 0
  END as minutes_remaining,
  (
    SELECT COUNT(*)
    FROM lead_assignment_history h
    WHERE h.lead_id = l.id
  ) as total_assignments,
  (
    SELECT COUNT(*)
    FROM lead_assignment_history h
    WHERE h.lead_id = l.id AND h.action = 'expired'
  ) as times_expired
FROM leads l
LEFT JOIN projects p ON p.id = l.project_id
LEFT JOIN users u ON u.id = l.assigned_to;

-- 11. VIEW: Sales rep workload
CREATE OR REPLACE VIEW sales_rep_workload AS
SELECT
  u.id as user_id,
  u.first_name || ' ' || COALESCE(u.last_name, '') as user_name,
  up.project_id,
  p.name as project_name,
  up.leads_assigned_today,
  up.max_leads_per_day,
  up.max_leads_per_day - up.leads_assigned_today as leads_available,
  up.last_assigned_at,
  (
    SELECT COUNT(*)
    FROM leads l
    WHERE l.assigned_to = u.id
      AND l.attention_expired = false
      AND l.attention_deadline > NOW()
  ) as active_leads_count
FROM users u
JOIN user_projects up ON up.user_id = u.id AND up.is_active = true
JOIN projects p ON p.id = up.project_id
WHERE u.is_active = true
ORDER BY up.leads_assigned_today ASC;

-- 12. Enable RLS
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignment_history ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies (permissive for development)
DROP POLICY IF EXISTS "Allow all for user_projects" ON user_projects;
CREATE POLICY "Allow all for user_projects" ON user_projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for lead_assignment_history" ON lead_assignment_history;
CREATE POLICY "Allow all for lead_assignment_history" ON lead_assignment_history FOR ALL USING (true) WITH CHECK (true);

-- 14. Seed: Make sure 'pool' status exists
INSERT INTO lead_statuses (name, slug, color, position, module, is_active)
VALUES ('Pool de Oportunidades', 'pool', '#71717A', 0, 'pool', true)
ON CONFLICT (slug) DO NOTHING;

-- 15. Seed: Make sure 'nuevo' (new/incoming) status exists
INSERT INTO lead_statuses (name, slug, color, position, module, is_active)
VALUES ('Nuevo', 'nuevo', '#3B82F6', 1, 'comercial', true)
ON CONFLICT (slug) DO NOTHING;

-- 16. Seed: Make sure 'contactado' status exists
INSERT INTO lead_statuses (name, slug, color, position, module, is_active)
VALUES ('Contactado', 'contactado', '#10B981', 2, 'comercial', true)
ON CONFLICT (slug) DO NOTHING;
