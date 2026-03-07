"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  IconBell,
  IconCheck,
  IconCheckbox,
  IconUser,
  IconClock,
  IconMessage,
  IconCalendar,
  IconAlertTriangle,
  IconTicket,
  IconSettings,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import {
  useNotificationsWithRealtime,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/use-notifications"
import type { NotificationWithLead } from "@/lib/services/notifications"

interface NotificationsDropdownProps {
  userId: string
}

const notificationIcons: Record<string, typeof IconBell> = {
  lead_assigned: IconUser,
  lead_expiring: IconClock,
  lead_expired: IconAlertTriangle,
  task_assigned: IconCheckbox,
  task_due: IconClock,
  task_overdue: IconAlertTriangle,
  appointment_reminder: IconCalendar,
  payment_received: IconTicket,
  reservation_created: IconTicket,
  message_received: IconMessage,
  system: IconSettings,
}

const notificationColors: Record<string, string> = {
  lead_assigned: "text-chart-2 bg-chart-2/10",
  lead_expiring: "text-chart-4 bg-chart-4/10",
  lead_expired: "text-destructive bg-destructive/10",
  task_assigned: "text-chart-3 bg-chart-3/10",
  task_due: "text-chart-4 bg-chart-4/10",
  task_overdue: "text-destructive bg-destructive/10",
  appointment_reminder: "text-chart-5 bg-chart-5/10",
  payment_received: "text-chart-2 bg-chart-2/10",
  reservation_created: "text-chart-1 bg-chart-1/10",
  message_received: "text-chart-2 bg-chart-2/10",
  system: "text-muted-foreground bg-muted",
}

function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: NotificationWithLead
  onMarkRead: () => void
  onClick: () => void
}) {
  const Icon = notificationIcons[notification.type] || IconBell
  const colorClass = notificationColors[notification.type] || "text-muted-foreground bg-muted"
  const [iconColor, bgColor] = colorClass.split(" ")

  return (
    <button type="button"
      className={cn(
        "w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3",
        !notification.read && "bg-primary/5"
      )}
      onClick={onClick}
    >
      <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", bgColor)}>
        <Icon className={cn("size-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm line-clamp-1",
            !notification.read && "font-medium"
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onMarkRead()
              }}
            >
              <IconCheck className="size-3" />
            </Button>
          )}
        </div>
        {notification.message && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>
      {!notification.read && (
        <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </button>
  )
}

export function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const router = useRouter()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  // Handle new notification toast
  const handleNewNotification = useCallback((notification: NotificationWithLead) => {
    toast(notification.title, {
      description: notification.message,
      action: notification.link
        ? {
            label: "Ver",
            onClick: () => router.push(notification.link!),
          }
        : undefined,
    })
  }, [router])

  const { notifications, unreadCount, isLoading } = useNotificationsWithRealtime(
    userId,
    handleNewNotification
  )

  const handleNotificationClick = async (notification: NotificationWithLead) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id)
    }

    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync(userId)
      toast.success("Todas las notificaciones marcadas como leídas")
    } catch {
      toast.error("Error al marcar notificaciones")
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 size-5 p-0 justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <IconBell className="size-6 animate-pulse text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className="group">
                  <NotificationItem
                    notification={notification}
                    onMarkRead={() => markAsRead.mutate(notification.id)}
                    onClick={() => handleNotificationClick(notification)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IconBell className="size-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Sin notificaciones</p>
              <p className="text-xs mt-1">Te avisaremos cuando haya algo nuevo</p>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={() => router.push("/notificaciones")}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
