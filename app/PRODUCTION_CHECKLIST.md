# Urbania CRM - Checklist de Producción

Este documento lista las tareas pendientes y consideraciones antes de desplegar a producción.

---

## 🔐 Seguridad y Autenticación

### 1. Restaurar Políticas RLS de Producción

**Estado actual:** Políticas de desarrollo permisivas (acceso anónimo permitido)

**Archivo afectado:** `supabase/migrations/003_dev_rls_policies.sql`

**Acción requerida:**
- [ ] Crear nueva migración `004_production_rls_policies.sql` que restaure políticas basadas en autenticación
- [ ] Las políticas deben verificar `auth.uid()` para todas las operaciones
- [ ] Implementar políticas específicas por rol (admin, vendedor, gerente)

**Ejemplo de política de producción:**
```sql
-- Leads: Solo usuarios autenticados pueden ver leads de su equipo
CREATE POLICY "Team members can view their leads" ON leads
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.team_id = leads.team_id
      )
    )
  );

-- Leads: Solo el asignado o admins pueden actualizar
CREATE POLICY "Assigned users can update leads" ON leads
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() AND u.role_id IN (
          SELECT id FROM roles WHERE name IN ('admin', 'gerente')
        )
      )
    )
  );
```

**Tablas que requieren políticas de producción:**
- [ ] `leads` - Acceso por asignación y equipo
- [ ] `users` - Perfil propio y directorio de empresa
- [ ] `projects` - Acceso por equipo/empresa
- [ ] `activities` - Acceso por lead asociado
- [ ] `tasks` - Acceso por asignación
- [ ] `appointments` - Acceso por participante
- [ ] `conversations` / `messages` - Acceso por participante
- [ ] `notifications` - Solo notificaciones propias
- [ ] `reservations` / `payments` - Acceso por lead/cliente asociado
- [ ] `documents` - Acceso por lead/proyecto asociado

---

## 🔑 Configuración de Autenticación

### 2. Implementar Flujo de Login Real

**Estado actual:** Sin autenticación real implementada

**Acciones requeridas:**
- [ ] Configurar proveedores de autenticación en Supabase (email/password, Google, etc.)
- [ ] Implementar página de login funcional con `supabase.auth.signInWithPassword()`
- [ ] Implementar registro de usuarios con verificación de email
- [ ] Configurar recuperación de contraseña
- [ ] Implementar cierre de sesión

### 3. Configurar Variables de Entorno de Producción

- [ ] Crear proyecto de Supabase de producción (separado del de desarrollo)
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL` de producción
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_ANON_KEY` de producción
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` (solo para operaciones de servidor)
- [ ] Verificar que las claves de desarrollo NO estén en el código

---

## 🗄️ Base de Datos

### 4. Migración de Datos

- [ ] Exportar datos de prueba necesarios
- [ ] Limpiar datos de desarrollo/test
- [ ] Aplicar todas las migraciones en orden en producción
- [ ] Verificar integridad referencial
- [ ] Crear usuarios iniciales (admins)

### 5. Índices y Optimización

- [ ] Revisar y crear índices para consultas frecuentes
- [ ] Configurar connection pooling en Supabase
- [ ] Establecer límites de rate limiting

---

## 🌐 Despliegue

### 6. Configuración de Hosting

- [ ] Configurar dominio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Configurar CDN para assets estáticos
- [ ] Configurar variables de entorno en plataforma de hosting

### 7. Monitoreo y Logging

- [ ] Configurar servicio de error tracking (Sentry, etc.)
- [ ] Configurar analytics (Google Analytics, Plausible, etc.)
- [ ] Configurar alertas de salud del servidor
- [ ] Configurar backups automáticos de base de datos

---

## 📋 Testing Pre-Producción

### 8. Verificaciones Finales

- [ ] Test de flujo completo de autenticación
- [ ] Test de permisos por rol
- [ ] Test de todas las operaciones CRUD principales
- [ ] Test de rendimiento bajo carga
- [ ] Verificar que no hay datos sensibles en logs
- [ ] Verificar que no hay claves hardcodeadas en el código

---

## 📅 Historial de Cambios

| Fecha | Descripción | Estado |
|-------|-------------|--------|
| 2025-01-25 | Creación del checklist | ✅ |
| 2025-01-25 | Aplicadas políticas RLS de desarrollo (`003_dev_rls_policies.sql`) | ⚠️ Temporal |

---

## Notas Importantes

> ⚠️ **CRÍTICO:** Las políticas RLS actuales permiten acceso anónimo a todas las tablas.
> Esto es SOLO para desarrollo. DEBE restaurarse la seguridad antes de producción.

> 📁 **Archivo de referencia:** `supabase/migrations/003_dev_rls_policies.sql` contiene
> las políticas permisivas que deben ser revertidas/reemplazadas.
