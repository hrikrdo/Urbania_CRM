import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]

export type NotificationType =
  | "lead_assigned"
  | "lead_expiring"
  | "lead_expired"
  | "task_assigned"
  | "task_due"
  | "task_overdue"
  | "appointment_reminder"
  | "payment_received"
  | "reservation_created"
  | "message_received"
  | "system"

export type NotificationWithLead = Notification & {
  lead?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

// Get notifications for the current user
export async function getNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }
): Promise<NotificationWithLead[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase
    .from("notifications") as any)
    .select("*")
    .eq("user_id", userId)

  if (options?.unreadOnly) {
    query = query.eq("read", false)
  }

  query = query.order("created_at", { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data: notifications, error } = await query

  if (error) throw error
  if (!notifications || notifications.length === 0) return []

  // Fetch related leads
  const leadIds = [...new Set(notifications.map((n: Notification) => n.lead_id).filter(Boolean))]

  if (leadIds.length === 0) {
    return notifications.map((n: Notification) => ({ ...n, lead: null }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leads } = await (supabase
    .from("leads") as any)
    .select("id, first_name, last_name")
    .in("id", leadIds)

  const leadsMap = new Map((leads || []).map((l: { id: string; first_name: string | null; last_name: string | null }) => [l.id, l]))

  return notifications.map((notification: Notification) => ({
    ...notification,
    lead: notification.lead_id ? leadsMap.get(notification.lead_id) || null : null,
  }))
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase
    .from("notifications") as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) throw error
  return count || 0
}

// Create a notification
export async function createNotification(notification: NotificationInsert): Promise<Notification> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("notifications") as any)
    .insert(notification)
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

// Create notifications for multiple users
export async function createNotificationForUsers(
  userIds: string[],
  notification: Omit<NotificationInsert, "user_id">
): Promise<void> {
  const supabase = createClient()

  const notifications = userIds.map((userId) => ({
    ...notification,
    user_id: userId,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("notifications") as any)
    .insert(notifications)

  if (error) throw error
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("notifications") as any)
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)

  if (error) throw error
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("notifications") as any)
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) throw error
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("notifications") as any)
    .delete()
    .eq("id", notificationId)

  if (error) throw error
}

// Delete old read notifications (older than 30 days)
export async function cleanupOldNotifications(userId: string): Promise<void> {
  const supabase = createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("notifications") as any)
    .delete()
    .eq("user_id", userId)
    .eq("read", true)
    .lt("created_at", thirtyDaysAgo)

  if (error) throw error
}

// Helper function to create common notification types
export const NotificationTemplates = {
  leadAssigned: (leadId: string, leadName: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "lead_assigned",
    title: "Nuevo lead asignado",
    message: `Se te ha asignado el lead: ${leadName}`,
    link: `/comercial?lead=${leadId}`,
  }),

  leadExpiring: (leadId: string, leadName: string, minutesLeft: number): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "lead_expiring",
    title: "Lead por expirar",
    message: `El lead ${leadName} expira en ${minutesLeft} minutos`,
    link: `/comercial?lead=${leadId}`,
  }),

  leadExpired: (leadId: string, leadName: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "lead_expired",
    title: "Lead expirado",
    message: `El lead ${leadName} ha sido enviado al pool`,
    link: `/pool`,
  }),

  taskAssigned: (leadId: string | null, taskTitle: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "task_assigned",
    title: "Nueva tarea asignada",
    message: taskTitle,
    link: leadId ? `/comercial?lead=${leadId}` : `/tareas`,
  }),

  taskDue: (leadId: string | null, taskTitle: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "task_due",
    title: "Tarea próxima a vencer",
    message: taskTitle,
    link: leadId ? `/comercial?lead=${leadId}` : `/tareas`,
  }),

  appointmentReminder: (leadId: string, leadName: string, appointmentTime: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "appointment_reminder",
    title: "Recordatorio de cita",
    message: `Cita con ${leadName} a las ${appointmentTime}`,
    link: `/agenda`,
  }),

  messageReceived: (leadId: string, leadName: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "message_received",
    title: "Nuevo mensaje",
    message: `${leadName} te ha enviado un mensaje`,
    link: `/comercial?lead=${leadId}&tab=chat`,
  }),

  reservationCreated: (leadId: string, leadName: string, projectName: string): Omit<NotificationInsert, "user_id"> => ({
    lead_id: leadId,
    type: "reservation_created",
    title: "Nueva reserva",
    message: `${leadName} ha reservado en ${projectName}`,
    link: `/comercial?lead=${leadId}`,
  }),
}
