-- Urbania CRM - Development RLS Policies
-- WARNING: These policies are for DEVELOPMENT ONLY
-- Remove or modify these for production use

-- ============================================
-- LEADS TABLE - Allow anonymous access for dev
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
DROP POLICY IF EXISTS "Anyone can view leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON leads;
DROP POLICY IF EXISTS "Anyone can delete leads" ON leads;

-- Create permissive policies for development
CREATE POLICY "Anyone can view leads" ON leads
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leads" ON leads
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete leads" ON leads
  FOR DELETE USING (true);

-- ============================================
-- PROJECTS TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Anyone can insert projects" ON projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON projects;

CREATE POLICY "Anyone can view projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert projects" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update projects" ON projects
  FOR UPDATE USING (true);

-- ============================================
-- LEAD_STATUSES TABLE - Allow read access
-- ============================================

DROP POLICY IF EXISTS "Anyone can view lead_statuses" ON lead_statuses;

ALTER TABLE lead_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lead_statuses" ON lead_statuses
  FOR SELECT USING (true);

-- ============================================
-- USERS TABLE - Allow read access for dev
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;

CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update users" ON users
  FOR UPDATE USING (true);

-- ============================================
-- ACTIVITIES TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can insert activities" ON activities;
DROP POLICY IF EXISTS "Anyone can view activities" ON activities;
DROP POLICY IF EXISTS "Anyone can insert activities" ON activities;
DROP POLICY IF EXISTS "Anyone can update activities" ON activities;

CREATE POLICY "Anyone can view activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert activities" ON activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update activities" ON activities
  FOR UPDATE USING (true);

-- ============================================
-- TASKS TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can manage tasks" ON tasks;

CREATE POLICY "Anyone can manage tasks" ON tasks
  FOR ALL USING (true);

-- ============================================
-- APPOINTMENTS TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can manage appointments" ON appointments;

CREATE POLICY "Anyone can manage appointments" ON appointments
  FOR ALL USING (true);

-- ============================================
-- CONVERSATIONS TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can manage conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can manage conversations" ON conversations;

CREATE POLICY "Anyone can manage conversations" ON conversations
  FOR ALL USING (true);

-- ============================================
-- MESSAGES TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can manage messages" ON messages;

CREATE POLICY "Anyone can manage messages" ON messages
  FOR ALL USING (true);

-- ============================================
-- NOTIFICATIONS TABLE - Allow full access for dev
-- ============================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can manage notifications" ON notifications;

CREATE POLICY "Anyone can manage notifications" ON notifications
  FOR ALL USING (true);
