# Urbania CRM - Plan de Implementación

> **Última actualización**: 2026-01-24
> **Estado**: Fase 1 en progreso

---

## Estado Actual de la BD (Verificado)

Las siguientes tablas YA EXISTEN en Supabase con datos:

### Tablas Implementadas ✅

```sql
-- PROFILES (usuarios del sistema)
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT,              -- 'director', 'gerente', 'vendedor', 'tramitador', 'marketing'
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN,
  metadata JSONB,
  created_at, updated_at
)

-- LEADS (prospectos)
leads (
  id UUID PRIMARY KEY,
  full_name TEXT,         -- Nota: NO es first_name/last_name
  email TEXT,
  phone TEXT,
  company_name TEXT,
  current_stage TEXT,     -- 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
  interest_level TEXT,    -- 'cold', 'warm', 'hot'
  assigned_to UUID,       -- FK a profiles
  marketing_source TEXT,
  marketing_medium TEXT,
  marketing_campaign TEXT,
  assigned_project_id UUID,
  budget_max DECIMAL,
  monthly_income DECIMAL,
  ai_score INTEGER,
  ai_summary TEXT,
  tags JSONB,
  is_archived BOOLEAN,
  created_at, updated_at
)

-- PROJECTS (proyectos inmobiliarios)
projects (
  id UUID PRIMARY KEY,
  name TEXT,
  location TEXT,          -- Nota: NO es address/city separados
  description TEXT,
  total_units INTEGER,
  features JSONB,         -- Nota: NO es 'amenities'
  status TEXT,
  created_at, updated_at
)

-- UNITS (unidades)
units (
  id UUID PRIMARY KEY,
  project_id UUID,
  model_name TEXT,        -- Nota: NO hay tabla unit_types
  unit_number TEXT,
  floor_number INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqm DECIMAL,
  price DECIMAL,
  status TEXT,            -- 'available', 'reserved', 'sold'
  reserved_at TIMESTAMPTZ,
  reserved_by_lead_id UUID,
  created_at, updated_at
)

-- APPOINTMENTS (citas)
appointments (
  id UUID PRIMARY KEY,
  lead_id UUID,
  host_id UUID,
  title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  outcome_notes TEXT,
  type TEXT,              -- 'call', 'site_visit', 'video_call', 'meeting'
  status TEXT,            -- 'scheduled', 'completed', 'cancelled', 'no_show'
  location TEXT,
  meeting_link TEXT,
  created_at, updated_at
)

-- ACTIVITIES (historial)
activities (
  id UUID PRIMARY KEY,
  lead_id UUID,
  user_id UUID,
  type TEXT,
  description TEXT,
  metadata JSONB,
  created_at
)

-- LEAD_STAGE_HISTORY (cambios de etapa)
lead_stage_history (
  id UUID PRIMARY KEY,
  lead_id UUID,
  from_stage TEXT,
  to_stage TEXT,
  changed_by UUID,
  reason TEXT,
  created_at
)

-- RETURNS (devoluciones de leads)
returns (
  id UUID PRIMARY KEY,
  lead_id UUID,
  original_owner_id UUID,
  reason TEXT,
  status TEXT,
  created_at,
  resolved_at
)
```

### Tablas Pendientes de Crear ❌

Para completar el sistema según el plan original, faltan:

| Tabla | Prioridad | Módulo |
|-------|-----------|--------|
| `lead_statuses` | Alta | Comercial (etapas configurables) |
| `tasks` | Media | Comercial (tareas pendientes) |
| `credit_checks` | Media | Trámites |
| `reservations` | Media | Inventario/Cierre |
| `payments` | Media | Cierre |
| `campaigns` | Baja | Marketing |
| `ad_sets` / `ads` | Baja | Marketing |
| `documents` | Baja | General |
| `notifications` | Media | General |
| `conversations` | Alta* | WhatsApp |
| `messages` | Alta* | WhatsApp |
| `message_templates` | Alta* | WhatsApp |

*Alta solo si WhatsApp es prioridad

---

## Plan Ajustado de Implementación

### Fase 1A: Comercial + Pool (PRIORIDAD ACTUAL)

**Objetivo**: Pipeline de ventas funcional con la BD actual

1. **Usar `current_stage` como etapas** (sin tabla lead_statuses por ahora)
2. **Implementar vista Kanban** con dnd-kit
3. **Implementar lista con filtros** usando data-table
4. **Panel lateral de detalle** de lead
5. **Pool de oportunidades** (leads sin asignar)
6. **Timer de atención** (agregar campos `attention_deadline`, `pool_entered_at` a leads)

**Migración necesaria**:
```sql
-- Agregar campos para Pool y Timer
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attention_deadline TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attention_expired BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pool_entered_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pool_claimed_by UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pool_claimed_at TIMESTAMPTZ;
```

### Fase 1B: Mejoras BD (después de UI funcional)

- Crear tabla `lead_statuses` para etapas configurables
- Crear tabla `tasks` para tareas pendientes
- Crear tabla `notifications` para alertas

### Fase 2: Inventario + Reservas
### Fase 3: Trámites (APC)
### Fase 4: Agenda
### Fase 5: WhatsApp
### Fase 6: Marketing
### Fase 7: Dashboard Analytics

---

## Etapas del Pipeline (Configuración Inicial)

Usando el campo `current_stage` de leads:

| Etapa | Slug | Color | Módulo |
|-------|------|-------|--------|
| Nuevo | `new` | #3B82F6 (blue) | Comercial |
| Contactado | `contacted` | #8B5CF6 (violet) | Comercial |
| Calificado | `qualified` | #10B981 (emerald) | Comercial |
| Propuesta | `proposal` | #F59E0B (amber) | Comercial |
| Negociación | `negotiation` | #EF4444 (red) | Comercial |
| Ganado | `won` | #22C55E (green) | Cierre |
| Perdido | `lost` | #6B7280 (gray) | Archivo |

---

# PLAN ORIGINAL (Referencia)

Claude's Plan
Plan: Urbania CRM - Sistema PropTech para Panamá
Resumen Ejecutivo
CRM inmobiliario a medida siguiendo las mejores prácticas del mercado PropTech (mercado proyectado a $89.93B para 2032). Arquitectura moderna con Next.js 14+, Supabase (PostgreSQL), y shadcn/ui.

Stack Tecnológico
Capa	Tecnología	Justificación
Frontend	Next.js 14+ (App Router)	SSR, RSC, mejor SEO y performance
UI	shadcn/ui + Tailwind CSS	Componentes accesibles, customizables
Backend	Supabase (PostgreSQL)	RLS, Real-time, Auth integrado
Auth	Supabase Auth	Multi-tenant, roles nativos
Real-time	Supabase Realtime	WebSockets para notificaciones
Storage	Supabase Storage	Documentos, imágenes
APIs Externas	Meta Ads API, Google Ads API	Marketing attribution
WhatsApp	WhatsApp Cloud API (Meta)	Comunicación directa, sin intermediarios
Validación	Zod + react-hook-form	Type-safe forms
Estado	Zustand / TanStack Query	Client state + server cache
Arquitectura de Base de Datos
Diagrama ER Simplificado

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │────<│  leads      │>────│  projects   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   roles     │     │ activities  │     │   units     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │credit_checks│     │reservations │
                    └─────────────┘     └─────────────┘
Tablas Principales
1. Core - Usuarios y Roles

-- Roles del sistema
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'admin', 'gerente', 'vendedor', 'tramitador', 'marketing'
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios (extiende auth.users)
CREATE TABLE users (
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

-- Equipos de ventas
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);
2. Proyectos e Inventario

-- Proyectos inmobiliarios
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  type VARCHAR(50), -- 'residencial', 'comercial', 'mixto'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'coming_soon', 'sold_out', 'archived'
  total_units INTEGER DEFAULT 0,
  available_units INTEGER DEFAULT 0,
  price_from DECIMAL(12, 2),
  price_to DECIMAL(12, 2),
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de unidades
CREATE TABLE unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100), -- '1 Recámara', '2 Recámaras', 'Penthouse'
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  area_m2 DECIMAL(8, 2),
  base_price DECIMAL(12, 2),
  floor_plan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unidades individuales (inventario)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id),
  unit_number VARCHAR(20) NOT NULL,
  floor INTEGER,
  view VARCHAR(100), -- 'mar', 'ciudad', 'piscina'
  area_m2 DECIMAL(8, 2),
  price DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold', 'blocked'
  reserved_by UUID REFERENCES leads(id),
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, unit_number)
);
3. Leads y Pipeline

-- Estados del lead (configurable)
CREATE TABLE lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_transition_to UUID REFERENCES lead_statuses(id), -- transición automática
  auto_transition_hours INTEGER, -- horas para transición
  module VARCHAR(50), -- 'comercial', 'tramites', 'inventario', 'cierre', 'postventa'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert estados iniciales
INSERT INTO lead_statuses (name, slug, position, module) VALUES
  ('Lead Entrante', 'lead_entrante', 1, 'comercial'),
  ('En Conversación', 'en_conversacion', 2, 'comercial'),
  ('Precalificación', 'precalificacion', 3, 'tramites'),
  ('Cita Agendada', 'cita_agendada', 4, 'comercial'),
  ('Visita Realizada', 'visita_realizada', 5, 'comercial'),
  ('Reserva', 'reserva', 6, 'inventario'),
  ('Trámite Bancario', 'tramite_bancario', 7, 'tramites'),
  ('Escrituración', 'escrituracion', 8, 'cierre'),
  ('Entrega', 'entrega', 9, 'cierre'),
  ('Post-Venta', 'postventa', 10, 'postventa'),
  ('Rechazado', 'rechazado', 99, NULL),
  ('Pool Oportunidades', 'pool', 0, 'pool');

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos personales
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  phone_secondary VARCHAR(20),
  cedula VARCHAR(20), -- Cédula panameña

  -- Estado y asignación
  status_id UUID REFERENCES lead_statuses(id) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  previous_assigned_to UUID REFERENCES users(id),

  -- Proyecto de interés
  project_id UUID REFERENCES projects(id),
  unit_type_preference UUID REFERENCES unit_types(id),
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),

  -- Fuente y atribución
  source VARCHAR(50), -- 'facebook', 'google', 'instagram', 'whatsapp', 'referral', 'walk_in'
  source_campaign_id UUID REFERENCES campaigns(id),
  source_ad_id VARCHAR(100),
  source_adset_id VARCHAR(100),
  source_keyword VARCHAR(255),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),

  -- Métricas de engagement
  call_attempts INTEGER DEFAULT 0,
  chat_attempts INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,

  -- Scoring
  lead_score INTEGER DEFAULT 0,
  temperature VARCHAR(20) DEFAULT 'cold', -- 'hot', 'warm', 'cold'

  -- Pool de oportunidades
  pool_entered_at TIMESTAMPTZ,
  pool_claimed_by UUID REFERENCES users(id),
  pool_claimed_at TIMESTAMPTZ,

  -- Timer de atención (60 min)
  attention_deadline TIMESTAMPTZ,
  attention_expired BOOLEAN DEFAULT false,

  -- Metadatos
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_leads_status ON leads(status_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_attention_deadline ON leads(attention_deadline) WHERE attention_expired = false;
CREATE INDEX idx_leads_pool ON leads(pool_entered_at) WHERE status_id = (SELECT id FROM lead_statuses WHERE slug = 'pool');
4. Actividades e Historial

-- Tipos de actividad
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

-- Historial de actividades
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type activity_type NOT NULL,
  title VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}', -- datos adicionales según tipo
  is_automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_lead ON activities(lead_id, created_at DESC);

-- Tareas pendientes
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
5. Verificación Crediticia (APC)

-- Verificaciones de crédito
CREATE TABLE credit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES users(id),

  -- Datos APC
  cedula VARCHAR(20) NOT NULL,
  apc_status VARCHAR(20), -- 'good', 'fair', 'bad', 'no_history'
  apc_score INTEGER,
  apc_verified_at TIMESTAMPTZ,
  apc_notes TEXT,

  -- Ingresos
  monthly_income DECIMAL(12, 2),
  income_verified BOOLEAN DEFAULT false,
  employment_type VARCHAR(50), -- 'employed', 'self_employed', 'retired', 'other'
  employer_name VARCHAR(200),

  -- Precalificación bancaria
  bank_name VARCHAR(100),
  prequalified BOOLEAN,
  prequalified_amount DECIMAL(12, 2),
  prequalified_rate DECIMAL(5, 2),
  prequalified_term_months INTEGER,
  estimated_monthly_payment DECIMAL(12, 2),
  prequalification_date TIMESTAMPTZ,
  prequalification_expires TIMESTAMPTZ,
  prequalification_notes TEXT,

  -- Aprobación formal
  formal_approval BOOLEAN,
  formal_approval_date TIMESTAMPTZ,
  formal_approval_amount DECIMAL(12, 2),
  formal_approval_notes TEXT,

  -- Resultado final
  result VARCHAR(20), -- 'approved', 'rejected', 'pending', 'needs_cosigner'
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
6. Reservas y Pagos

-- Reservas
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  unit_id UUID REFERENCES units(id),
  project_id UUID REFERENCES projects(id),

  -- Precios
  unit_price DECIMAL(12, 2) NOT NULL,
  separation_amount DECIMAL(12, 2), -- Monto de separación
  initial_payment DECIMAL(12, 2), -- Abono inicial
  notary_costs DECIMAL(12, 2), -- Costos de escritura

  -- Estados
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  separation_paid BOOLEAN DEFAULT false,
  separation_paid_at TIMESTAMPTZ,
  initial_payment_paid BOOLEAN DEFAULT false,
  initial_payment_paid_at TIMESTAMPTZ,

  -- Desembolso
  bank_disbursement_amount DECIMAL(12, 2),
  bank_disbursement_date TIMESTAMPTZ,

  -- Entrega
  delivery_scheduled_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  delivery_notes TEXT,

  -- Documentos
  contract_url TEXT,
  deed_url TEXT,

  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos registrados
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),

  type VARCHAR(50) NOT NULL, -- 'separation', 'initial', 'monthly', 'notary', 'other'
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50), -- 'transfer', 'check', 'cash', 'financing'
  reference_number VARCHAR(100),

  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,

  notes TEXT,
  receipt_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
7. Agenda y Citas

-- Citas y visitas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),

  type VARCHAR(50) NOT NULL, -- 'visit', 'call', 'video_call', 'meeting'
  title VARCHAR(255),
  description TEXT,
  location TEXT,

  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- Confirmaciones
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  client_confirmed BOOLEAN,
  client_confirmed_at TIMESTAMPTZ,

  -- Resultado
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
  attended BOOLEAN,
  outcome TEXT,
  follow_up_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
8. Marketing y Campañas

-- Campañas publicitarias
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),

  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'google', 'instagram', 'tiktok'
  external_id VARCHAR(100), -- ID en la plataforma

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

  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
  start_date DATE,
  end_date DATE,

  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conjuntos de anuncios
CREATE TABLE ad_sets (
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

-- Anuncios individuales
CREATE TABLE ads (
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

-- Keywords (Google Ads)
CREATE TABLE keywords (
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
9. Documentos

-- Documentos del lead
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  uploaded_by UUID REFERENCES users(id),

  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'cedula', 'ficha_css', 'carta_trabajo', 'contrato', 'escritura', 'other'
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
10. Notificaciones

-- Notificaciones del sistema
CREATE TABLE notifications (
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

-- Logros y noticias (ticker)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  project_id UUID REFERENCES projects(id),

  type VARCHAR(50) NOT NULL, -- 'reservation', 'sale', 'delivery', 'milestone'
  title VARCHAR(255) NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
Diagrama de Flujo de Estados

                                    ┌──────────────────┐
                                    │  LEAD ENTRANTE   │
                                    │  (Timer 60 min)  │
                                    └────────┬─────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │ < 60 min           │                    │ > 60 min
                        ▼                    │                    ▼
               ┌─────────────────┐           │           ┌─────────────────┐
               │ EN CONVERSACIÓN │           │           │ POOL OPORTUN.   │
               └────────┬────────┘           │           └────────┬────────┘
                        │                    │                    │
                        │ Interés confirmado │                    │ Reclamado
                        ▼                    │                    │
               ┌─────────────────┐           │                    │
               │ PRECALIFICACIÓN │◄──────────┴────────────────────┘
               └────────┬────────┘
                        │
           ┌────────────┼────────────┐
           │ APC Buena  │            │ APC Mala / Ingresos
           ▼            │            ▼    insuficientes
    ┌──────────────┐    │     ┌──────────────┐
    │CITA AGENDADA │    │     │  RECHAZADO   │
    └──────┬───────┘    │     └──────────────┘
           │            │
           │ Asistió    │
           ▼            │
    ┌──────────────┐    │
    │   VISITA     │    │
    │  REALIZADA   │    │
    └──────┬───────┘    │
           │            │
           │ Decide comprar
           ▼            │
    ┌──────────────┐    │
    │   RESERVA    │◄───┘
    │ (Separación) │
    └──────┬───────┘
           │
           │ Pago separación
           ▼
    ┌──────────────┐
    │   TRÁMITE    │
    │   BANCARIO   │
    └──────┬───────┘
           │
           │ Aprobación formal
           ▼
    ┌──────────────┐
    │ESCRITURACIÓN │
    │ (Abono+Costos)│
    └──────┬───────┘
           │
           │ Desembolso
           ▼
    ┌──────────────┐
    │   ENTREGA    │
    └──────┬───────┘
           │
           │ Automático
           ▼
    ┌──────────────┐
    │  POST-VENTA  │
    └──────────────┘
Bloques shadcn/ui Recomendados
Los bloques de shadcn/ui son plantillas pre-construidas que aceleran el desarrollo. Se instalan con npx shadcn add [block-name].

Bloques Base del Sistema
Bloque	Uso en Urbania CRM	Instalación
dashboard-01	Dashboard principal con sidebar, charts y data table	npx shadcn add dashboard-01
sidebar-07	Sidebar colapsable a iconos (layout principal)	npx shadcn add sidebar-07
sidebar-03	Alternativa con submenús	npx shadcn add sidebar-03
login-02	Página de login con imagen	npx shadcn add login-02
login-04	Alternativa login con form e imagen	npx shadcn add login-04
Mapeo Bloques → Módulos

┌─────────────────────────────────────────────────────────────────┐
│  LAYOUT PRINCIPAL: sidebar-07 + dashboard-01 (base)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 DASHBOARD         → dashboard-01 (charts, KPIs, tables)     │
│  📞 COMERCIAL         → DataTable + Kanban custom               │
│  🏊 POOL              → Cards grid custom                       │
│  📋 TRÁMITES          → DataTable + Forms                       │
│  📅 AGENDA            → sidebar-12 (calendar sidebar) + custom  │
│  🏢 INVENTARIO        → DataTable + Grid custom                 │
│  ✍️ CIERRE            → Forms + Progress + Checklist            │
│  📈 MARKETING         → Charts + DataTable                      │
│  💬 WHATSAPP          → Custom chat components                  │
│  🔧 POST-VENTA        → DataTable + Tickets                     │
│                                                                  │
│  🔐 LOGIN             → login-02 o login-04                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
Componentes de dashboard-01 incluidos
El bloque dashboard-01 incluye:

AppSidebar - Sidebar responsive
SiteHeader - Header con búsqueda y usuario
ChartAreaInteractive - Gráficos interactivos (Recharts)
DataTable - Tabla con sorting/filtering
SectionCards - Cards de KPIs
Theme toggle (dark/light mode)
Sidebars Disponibles (16 variantes)
Sidebar	Descripción	Mejor para
sidebar-01	Simple con secciones	Apps pequeñas
sidebar-02	Secciones colapsables	Apps medianas
sidebar-03	Con submenús	Navegación compleja ⭐
sidebar-04	Flotante con submenús	Estilo moderno
sidebar-05	Submenús colapsables	Apps enterprise ⭐
sidebar-06	Submenús dropdown	Ahorra espacio
sidebar-07	Colapsa a iconos	Recomendado para CRM ⭐
sidebar-08	Inset con nav secundaria	Dos niveles nav
sidebar-09	Sidebars anidados colapsables	Estructura profunda
sidebar-10	En popover	Mobile-first
sidebar-11	Con file tree	Gestión archivos
sidebar-12	Con calendario	Agenda integrada ⭐
sidebar-13	En dialog	Modal nav
sidebar-14	A la derecha	Panel secundario
sidebar-15	Izquierda y derecha	Lead detail panel ⭐
sidebar-16	Con header sticky	Header siempre visible
Login Blocks (5 variantes)
Login	Descripción
login-01	Form simple centrado
login-02	Dos columnas con imagen ⭐
login-03	Fondo muted
login-04	Form + imagen combinados ⭐
login-05	Solo email (magic link)
Instalación Recomendada

# Base del proyecto
npx shadcn add dashboard-01
npx shadcn add sidebar-07
npx shadcn add sidebar-15  # Para panel lateral de lead
npx shadcn add login-02

# Componentes adicionales necesarios
npx shadcn add chart
npx shadcn add calendar
npx shadcn add data-table
npx shadcn add command      # Para búsqueda global (Cmd+K)
npx shadcn add sonner       # Para notificaciones toast
Estructura de Módulos (Frontend)
Layout General

┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Búsqueda Global | Notificaciones | Usuario          │
├─────────┬───────────────────────────────────────────────────────────┤
│         │                                                           │
│ SIDEBAR │                    CONTENIDO PRINCIPAL                    │
│         │                                                           │
│ Dashboard│  ┌─────────────────────────────────────────────────────┐ │
│ Comercial│  │  MÉTRICAS SUPERIORES (Cards KPI)                    │ │
│ Pool     │  └─────────────────────────────────────────────────────┘ │
│ Trámites │  ┌─────────────────────────────────────────────────────┐ │
│ Agenda   │  │                                                     │ │
│ Inventario│ │  CONTENIDO DINÁMICO (Kanban/Lista/Detalle)         │ │
│ Cierre   │  │                                                     │ │
│ Marketing│  └─────────────────────────────────────────────────────┘ │
│ PostVenta│                                                          │
│         │  ┌─────────────────────────────────────────────────────┐ │
│ ─────── │  │  TICKER DE LOGROS (scroll horizontal)               │ │
│ Config  │  └─────────────────────────────────────────────────────┘ │
├─────────┴───────────────────────────────────────────────────────────┤
│  PANEL LATERAL DERECHO: Detalle de Lead (siempre visible)          │
└─────────────────────────────────────────────────────────────────────┘
Módulo 1: Dashboard (Analytics)
Ruta: /dashboard

Componentes shadcn:

Card - KPI cards
Chart - Gráficos (Recharts)
Select - Filtros
Tabs - Períodos
KPIs:

Leads generados (total, hoy, semana)
Leads gestionados
Citas agendadas
Reservas
Tasa de conversión (%)
Pipeline por etapa (bar chart)
Filtros: Proyecto, Vendedor, Período

Ranking: Top vendedores con avatar, nombre, métricas

Ticker inferior: Logros recientes (reservas, ventas, entregas)

Módulo 2: Comercial (Captación)
Ruta: /comercial

Componentes shadcn:

Card - Métricas
Badge - Estados
Table - Lista de leads
Sheet - Panel de lead
Tabs - Kanban/Lista
DropdownMenu - Acciones rápidas
Dialog - Modales
Form - Formularios
Secciones:

Métricas superiores: Leads ingresados, % conversión, en negociación, citas, reservas

Leads entrantes (urgentes):

Cards con timer countdown (60 min)
Color cambia según tiempo restante
Botón "Atender"
Pipeline Kanban:

Columnas: Lead Entrante → En Conversación → Precalificación → Cita → Visita → Reserva...
Drag & drop
Cards con: nombre, teléfono, proyecto, tiempo en etapa
Lista histórica:

Columnas: ID, Nombre, Email, Teléfono, Ingreso, Última interacción, Intentos llamada, Intentos chat, Estado (editable), Fuente, Anuncio, Vendedor, Proyecto
Filtros avanzados
Exportación
Módulo 3: Pool de Oportunidades
Ruta: /pool

Componentes shadcn:

Card - Lead cards
Button - Reclamar
Select - Filtro proyecto
Badge - Tiempo en pool
Funcionalidad:

Leads no atendidos en 60 min
Agrupados por proyecto
Ordenados por antigüedad (descendente)
Botón "Reclamar" asigna al vendedor actual
Módulo 4: Trámites (Credit Scoring)
Ruta: /tramites

Componentes shadcn:

Card - Métricas
Table - Lista
Form - Verificación APC
RadioGroup - Estado APC
Input - Datos financieros
Alert - Notificaciones
Métricas: En trámite, En análisis, Aprobados, Rechazados

Formulario APC:

Cédula
Estado APC (Bueno/Regular/Malo/Sin historial)
Score
Ingresos mensuales
Tipo empleo
Empleador
Precalificación bancaria:

Banco
Monto aprobado
Tasa
Plazo
Letra estimada (calculada automáticamente)
Lógica automática:

APC mala → Notifica vendedor → Estado "Rechazado"
APC buena → Notifica vendedor → Calcula letra → Estado "Identificado/Aplica"
Módulo 5: Agenda
Ruta: /agenda

Componentes shadcn:

Calendar - Vista mensual
Dialog - Crear/editar cita
Form - Datos de cita
Select - Tipo, proyecto
Switch - Confirmaciones
Funcionalidades:

Vista calendario (mes/semana/día)
Crear cita desde lead
Marcar asistencia
Recordatorios automáticos
Módulo 6: Inventario
Ruta: /inventario

Componentes shadcn:

Tabs - Por proyecto
Table - Lista unidades
Badge - Estado (disponible/reservada/vendida)
Dialog - Detalle unidad
Form - Editar unidad
Vistas:

Grid visual (plano del edificio)
Lista con filtros
Detalle con especificaciones
Módulo 7: Cierre (Formalización)
Ruta: /cierre

Componentes shadcn:

Card - Etapas de cierre
Checkbox - Checklist
Progress - Avance
Form - Pagos
Table - Historial pagos
Checklist:

 Pago separación
 Aprobación formal banco
 Abono inicial
 Costos escritura
 Desembolso bancario
 Entrega física
Módulo 8: Marketing
Ruta: /marketing

Componentes shadcn:

Card - Métricas por plataforma
Chart - Performance
Table - Campañas, AdSets, Ads, Keywords
Tabs - Plataformas
Métricas:

Gasto total/por campaña
Leads generados
Conversaciones WhatsApp
CPL (Costo por Lead)
CPA (Costo por Adquisición)
ROI por campaña
Tablas:

Mejores campañas
Mejores conjuntos de anuncios
Mejores anuncios
Mejores keywords
Módulo 9: Post-Venta
Ruta: /postventa

Clientes entregados con:

Información de contacto
Unidad entregada
Historial de la venta
Tickets de soporte
Encuestas de satisfacción
Estructura de Archivos

urbania-crm/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Usa login-02 block
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # sidebar-07 + sidebar-15 (panel lead)
│   │   ├── page.tsx                # Dashboard (dashboard-01 base)
│   │   ├── comercial/
│   │   │   ├── page.tsx            # Kanban + DataTable
│   │   │   └── [leadId]/page.tsx   # Detalle lead
│   │   ├── pool/page.tsx
│   │   ├── tramites/page.tsx
│   │   ├── agenda/page.tsx         # Integra sidebar-12 calendar
│   │   ├── inventario/
│   │   │   ├── page.tsx
│   │   │   └── [projectId]/page.tsx
│   │   ├── cierre/page.tsx
│   │   ├── marketing/page.tsx
│   │   ├── mensajes/page.tsx       # WhatsApp conversations
│   │   ├── postventa/page.tsx
│   │   └── configuracion/
│   │       ├── usuarios/page.tsx
│   │       ├── proyectos/page.tsx
│   │       ├── etapas/page.tsx
│   │       └── whatsapp/page.tsx   # Config WhatsApp templates
│   ├── api/
│   │   ├── leads/route.ts
│   │   ├── webhooks/
│   │   │   ├── facebook/route.ts
│   │   │   ├── google/route.ts
│   │   │   └── whatsapp/route.ts   # WhatsApp webhook
│   │   └── cron/
│   │       ├── sync-ads/route.ts
│   │       └── check-expired-leads/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn components (auto-generated)
│   │   ├── sidebar.tsx             # De sidebar-07
│   │   ├── chart.tsx               # De dashboard-01
│   │   ├── data-table.tsx          # De dashboard-01
│   │   └── ...
│   ├── blocks/                     # shadcn blocks customizados
│   │   ├── app-sidebar.tsx         # Sidebar principal (de dashboard-01)
│   │   ├── site-header.tsx         # Header (de dashboard-01)
│   │   ├── section-cards.tsx       # KPI cards (de dashboard-01)
│   │   ├── lead-detail-sidebar.tsx # Panel derecho (de sidebar-15)
│   │   └── nav-user.tsx            # User menu (de dashboard-01)
│   ├── dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── pipeline-chart.tsx
│   │   ├── ranking-table.tsx
│   │   └── achievements-ticker.tsx
│   ├── leads/
│   │   ├── lead-card.tsx
│   │   ├── lead-detail-panel.tsx
│   │   ├── lead-kanban.tsx
│   │   ├── lead-table.tsx
│   │   ├── lead-timer.tsx
│   │   └── lead-form.tsx
│   ├── credit/
│   │   ├── apc-form.tsx
│   │   └── prequalification-form.tsx
│   ├── inventory/
│   │   ├── unit-grid.tsx
│   │   └── unit-card.tsx
│   ├── marketing/
│   │   ├── campaign-table.tsx
│   │   └── performance-chart.tsx
│   └── whatsapp/
│       ├── chat-window.tsx
│       ├── conversation-list.tsx
│       ├── message-bubble.tsx
│       ├── message-input.tsx
│       ├── template-selector.tsx
│       └── typing-indicator.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── whatsapp/
│   │   ├── api.ts                  # WhatsApp Cloud API client
│   │   ├── templates.ts            # Template helpers
│   │   └── webhook.ts              # Webhook verification
│   ├── hooks/
│   │   ├── use-leads.ts
│   │   ├── use-realtime.ts
│   │   ├── use-timer.ts
│   │   ├── use-conversations.ts
│   │   └── use-messages.ts
│   ├── utils.ts
│   └── validations/
│       ├── lead.ts
│       ├── credit.ts
│       └── message.ts
├── types/
│   ├── database.ts                 # Generated from Supabase
│   ├── whatsapp.ts                 # WhatsApp API types
│   └── index.ts
└── supabase/
    ├── functions/
    │   ├── whatsapp-webhook/       # Edge function
    │   ├── whatsapp-send/          # Edge function
    │   └── whatsapp-sync-templates/
    ├── migrations/
    └── seed.sql
Roles y Permisos
Permiso	Admin	Gerente	Vendedor	Tramitador	Marketing
Ver Dashboard completo	✅	✅	❌	❌	❌
Ver métricas propias	✅	✅	✅	✅	✅
Gestionar leads	✅	✅	✅ (propios)	❌	❌
Ver Pool	✅	✅	✅	❌	❌
Reclamar del Pool	✅	✅	✅	❌	❌
Verificar APC	✅	✅	❌	✅	❌
Gestionar inventario	✅	✅	❌	❌	❌
Crear reservas	✅	✅	✅	❌	❌
Registrar pagos	✅	✅	❌	✅	❌
Ver marketing	✅	✅	❌	❌	✅
Configuración	✅	❌	❌	❌	❌
Automatizaciones Clave
Timer 60 minutos:

Al crear lead → attention_deadline = NOW() + 60 min
Cron job cada minuto verifica expirados → mueve a Pool
Cambio automático de estado:

Lead en Precalificación + APC verificada buena → Cita Agendada
Reserva + Pago separación confirmado → Trámite Bancario
Entrega completada → Post-Venta
Notificaciones real-time:

Nuevo lead asignado
Lead próximo a expirar (5 min)
APC verificada
Pago confirmado
Sincronización Marketing:

Cron cada hora sincroniza métricas de Meta/Google Ads API
Webhook para leads de Facebook Lead Ads
Fases de Implementación
Fase 1: Core (2-3 semanas)
 Setup Next.js + Supabase + shadcn
 Instalar bloques base: dashboard-01, sidebar-07, sidebar-15, login-02
 Auth y roles con Supabase Auth
 Layout principal con sidebar colapsable
 CRUD Leads básico
 Pipeline Kanban (dnd-kit)
 Panel de detalle de lead (sidebar-15 derecho)
Fase 2: Comercial (1-2 semanas)
 Timer 60 minutos
 Pool de oportunidades
 Lista histórica con filtros
 Actividades e historial
Fase 2.5: WhatsApp Integration (1-2 semanas)
 Configurar Meta Business App
 Tablas conversations, messages, templates
 Edge Functions (webhook + send)
 ChatWindow y ConversationList
 Integrar con LeadDetail
 Realtime + notificaciones
Fase 3: Trámites (1 semana)
 Verificación APC
 Precalificación bancaria
 Cálculo automático de letra
 Notificaciones
Fase 4: Inventario y Reservas (1-2 semanas)
 CRUD Proyectos y Unidades
 Sistema de reservas
 Gestión de pagos
Fase 5: Agenda (1 semana)
 Calendario de citas
 Confirmaciones
 Recordatorios
Fase 6: Marketing (1-2 semanas)
 Integración Meta Ads API
 Integración Google Ads API
 Dashboard de métricas
Fase 7: Dashboard y Analytics (1 semana)
 KPIs y gráficos
 Ranking de vendedores
 Ticker de logros
Fase 8: Post-Venta y Pulido (1 semana)
 Módulo post-venta
 Optimizaciones
 Testing
Verificación
Base de datos: Ejecutar migraciones en Supabase, verificar RLS
Auth: Probar login con diferentes roles
Leads: Crear lead, verificar timer, mover a Pool
Pipeline: Drag & drop entre etapas
Trámites: Flujo completo de verificación APC
Reservas: Crear reserva, registrar pagos
Marketing: Verificar sincronización de métricas
Integración WhatsApp Business API
Comparativa de Proveedores
Proveedor	Costo Mensual	Setup	Mejor Para
WhatsApp Cloud API (Meta) ⭐	Solo costos conversación (~$0.03-0.08/conv)	10-30 min	Control total, sin intermediarios
Twilio	$0.005/mensaje + conversación	2-4 semanas	Multi-canal (SMS+WhatsApp+Email)
360dialog	$49-99/mes + conversación	10-15 min	Bajo costo, API pura
Wati	$49+/mes	Rápido	Dashboard incluido, no-code
Recomendación: WhatsApp Cloud API (oficial de Meta)

Sin markup de terceros
Control total sobre la integración
Arquitectura compatible (Supabase + React)
Escalabilidad sin cambiar de proveedor
Arquitectura WhatsApp

┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  LeadDetail  │  │  ChatWidget  │  │  ConversationList    │   │
│  │  + Chat Tab  │  │  (Embedded)  │  │  (Sidebar vendedor)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ conversations│  │   messages   │  │   message_templates  │   │
│  │    table     │  │    table     │  │       table          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Edge Functions (Deno/TypeScript)              │    │
│  │  • /whatsapp/send     - Enviar mensajes                 │    │
│  │  • /whatsapp/webhook  - Recibir mensajes (POST)         │    │
│  │  • /whatsapp/verify   - Verificar webhook (GET)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WhatsApp Cloud API (Meta)                       │
│  • Envío de mensajes (texto, media, templates)                   │
│  • Webhooks de mensajes entrantes                                │
│  • Status de entrega (sent, delivered, read)                     │
└─────────────────────────────────────────────────────────────────┘
Tablas de Base de Datos WhatsApp

-- Conversaciones de WhatsApp
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  whatsapp_conversation_id VARCHAR(100),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'closed'
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number)
);

-- Mensajes individuales
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(100) UNIQUE,
  direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
  message_type VARCHAR(20) NOT NULL, -- 'text', 'image', 'document', 'audio', 'template'
  content TEXT,
  media_url TEXT,
  media_mime_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  sent_by UUID REFERENCES users(id), -- NULL si es inbound
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas aprobadas por Meta
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50), -- 'marketing', 'utility', 'authentication'
  language VARCHAR(10) DEFAULT 'es',
  content TEXT NOT NULL,
  variables JSONB, -- ["nombre", "proyecto"]
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  whatsapp_template_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_to, status);
CREATE INDEX idx_conversations_phone ON conversations(phone_number);
Componentes Frontend WhatsApp
Estructura de archivos adicionales:


components/
├── whatsapp/
│   ├── chat-window.tsx        # Ventana de conversación
│   ├── conversation-list.tsx  # Lista de conversaciones
│   ├── message-bubble.tsx     # Burbuja de mensaje
│   ├── message-input.tsx      # Input con envío
│   ├── template-selector.tsx  # Selector de plantillas
│   ├── media-preview.tsx      # Preview de archivos
│   └── typing-indicator.tsx   # Indicador escribiendo
ChatWindow.tsx - Componentes shadcn:

ScrollArea - Lista de mensajes con scroll
Input - Escribir mensaje
Button - Enviar, adjuntar
DropdownMenu - Opciones (plantillas, media)
Badge - Estado del mensaje (enviado, entregado, leído)
Avatar - Foto del contacto
Tooltip - Timestamps
ConversationList.tsx:

Card - Preview de conversación
Badge - Mensajes no leídos
Input - Búsqueda
Tabs - Filtros (todas, sin leer, archivadas)
Edge Functions (Supabase)
1. Webhook para recibir mensajes:


// supabase/functions/whatsapp-webhook/index.ts
// - Verificar signature de Meta (X-Hub-Signature-256)
// - Procesar mensajes entrantes
// - Crear/actualizar conversación
// - Insertar mensaje en BD
// - Notificar via Realtime
// - Auto-asignar a vendedor si lead existe
// - Crear lead automático si es número nuevo
2. Función para enviar mensajes:


// supabase/functions/whatsapp-send/index.ts
// - Validar usuario autenticado
// - Verificar ventana de 24 horas
// - Si fuera de ventana → requiere template aprobado
// - Enviar mensaje via Graph API
// - Guardar en BD con status tracking
// - Registrar actividad en lead
3. Sincronización de templates:


// supabase/functions/whatsapp-sync-templates/index.ts
// - Obtener templates de Meta
// - Sincronizar con tabla local
// - Actualizar estados
Flujo de Mensajes

MENSAJE ENTRANTE:
1. Meta envía webhook → Edge Function
2. Verificar firma → Procesar payload
3. Buscar/crear conversación por phone_number
4. Buscar lead existente por teléfono
5. Si no existe lead → crear lead automático (source: 'whatsapp')
6. Insertar mensaje en BD
7. Supabase Realtime notifica al frontend
8. Frontend actualiza UI en tiempo real
9. Sonido de notificación si tab inactiva

MENSAJE SALIENTE:
1. Vendedor escribe mensaje en ChatWindow
2. Verificar ventana 24h (último mensaje entrante)
3. Si dentro de ventana → enviar texto libre
4. Si fuera de ventana → mostrar TemplateSelector
5. Llamar Edge Function /whatsapp/send
6. Insertar mensaje con status 'pending'
7. Meta confirma envío → actualizar status
8. Webhook de status → 'delivered' → 'read'
Configuración Meta Business
Requisitos previos:

Cuenta de Meta Business verificada
Número de teléfono dedicado (no registrado en WhatsApp personal)
Certificado SSL para webhook
Pasos:

Crear App en Meta for Developers
Agregar producto "WhatsApp Business"
Configurar número de teléfono de prueba
Obtener Access Token permanente (System User)
Registrar webhook URL: https://[project].supabase.co/functions/v1/whatsapp-webhook
Suscribirse a: messages, message_status
Automatizaciones WhatsApp
Auto-asignación:

Mensaje entrante → buscar lead por teléfono → asignar conversación al vendedor del lead
Lead automático:

Mensaje de número desconocido → crear lead con source='whatsapp'
Asignar según round-robin o proyecto mencionado
Notificaciones:

Realtime + sonido cuando llega mensaje
Push notification si app cerrada (futuro)
Registro de actividad:

Cada mensaje crea actividad en el lead
Actualiza last_contact_at y chat_attempts
Plantillas automáticas:

Bienvenida cuando lead es creado
Confirmación de cita
Recordatorio de visita
Costos Estimados WhatsApp
Concepto	Costo
WhatsApp Cloud API	~$0.03-0.08 por conversación (24h)
Conversaciones marketing	~$0.08
Conversaciones utility	~$0.03
Conversaciones service	Gratis (primeras 1000/mes)
Ejemplo mensual (500 leads):

500 conversaciones × $0.05 promedio = ~$25/mes
Fase de Implementación WhatsApp
Fase 2.5: WhatsApp Integration (1-2 semanas)

 Configurar Meta Business App
 Crear tablas conversations, messages, templates
 Implementar Edge Function webhook
 Implementar Edge Function send
 Crear ChatWindow component
 Crear ConversationList component
 Integrar con LeadDetail (tab WhatsApp)
 Implementar Realtime subscriptions
 Agregar notificaciones de nuevos mensajes
 Pruebas con número de prueba
 Migrar a número de producción
