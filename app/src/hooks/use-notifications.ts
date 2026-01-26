"use client"

import { useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type NotificationWithLead,
} from "@/lib/services/notifications"

// Query keys
export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: string, unreadOnly?: boolean) =>
    [...notificationKeys.all, "list", userId, unreadOnly] as const,
  unreadCount: (userId: string) =>
    [...notificationKeys.all, "unread", userId] as const,
}

// Fetch notifications
export function useNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
  }
) {
  return useQuery({
    queryKey: notificationKeys.list(userId, options?.unreadOnly),
    queryFn: () =>
      getNotifications(userId, {
        unreadOnly: options?.unreadOnly,
        limit: options?.limit || 50,
      }),
    enabled: !!userId,
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

// Fetch unread count
export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: () => getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Optimistically update
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })

      const queries = queryClient.getQueriesData<NotificationWithLead[]>({
        queryKey: notificationKeys.all,
      })

      queries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData(
            queryKey,
            data.map((notification) =>
              notification.id === notificationId
                ? { ...notification, read: true, read_at: new Date().toISOString() }
                : notification
            )
          )
        }
      })

      return { queries }
    },
    onError: (_err, _notificationId, context) => {
      // Rollback
      context?.queries.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data)
        }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

// Mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

// Real-time notifications subscription
export function useRealtimeNotifications(
  userId: string,
  onNewNotification?: (notification: NotificationWithLead) => void
) {
  const queryClient = useQueryClient()

  const handleNewNotification = useCallback(
    (payload: { new: NotificationWithLead }) => {
      const newNotification = payload.new

      // Update queries
      queryClient.setQueriesData<NotificationWithLead[]>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old) return [newNotification]
          return [newNotification, ...old]
        }
      )

      // Update unread count
      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(userId),
        (old) => (old || 0) + 1
      )

      // Call callback if provided
      onNewNotification?.(newNotification)
    },
    [queryClient, userId, onNewNotification]
  )

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        handleNewNotification
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, handleNewNotification])
}

// Combined hook for notifications with realtime
export function useNotificationsWithRealtime(
  userId: string,
  onNewNotification?: (notification: NotificationWithLead) => void
) {
  const notifications = useNotifications(userId, { limit: 50 })
  const unreadCount = useUnreadCount(userId)

  useRealtimeNotifications(userId, onNewNotification)

  return {
    notifications: notifications.data || [],
    unreadCount: unreadCount.data || 0,
    isLoading: notifications.isLoading || unreadCount.isLoading,
    error: notifications.error || unreadCount.error,
    refetch: () => {
      notifications.refetch()
      unreadCount.refetch()
    },
  }
}
