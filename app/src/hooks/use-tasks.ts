"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getTasksByLead,
  getTasksByUser,
  getOverdueTasks,
  getUpcomingTasks,
  createTask,
  updateTask,
  completeTask,
  cancelTask,
  deleteTask,
  getTaskCounts,
  type TaskWithRelations,
} from "@/lib/services/tasks"
import type { Database } from "@/types/database"

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"]
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"]

// Query keys
export const taskKeys = {
  all: ["tasks"] as const,
  byLead: (leadId: string) => [...taskKeys.all, "lead", leadId] as const,
  byUser: (userId: string, includeCompleted?: boolean) =>
    [...taskKeys.all, "user", userId, includeCompleted] as const,
  overdue: (userId?: string) => [...taskKeys.all, "overdue", userId] as const,
  upcoming: (userId?: string) => [...taskKeys.all, "upcoming", userId] as const,
  counts: (userId?: string) => [...taskKeys.all, "counts", userId] as const,
}

// Fetch tasks for a lead
export function useTasksByLead(leadId: string) {
  return useQuery({
    queryKey: taskKeys.byLead(leadId),
    queryFn: () => getTasksByLead(leadId),
    enabled: !!leadId,
  })
}

// Fetch tasks for a user
export function useTasksByUser(userId: string, includeCompleted = false) {
  return useQuery({
    queryKey: taskKeys.byUser(userId, includeCompleted),
    queryFn: () => getTasksByUser(userId, includeCompleted),
    enabled: !!userId,
  })
}

// Fetch overdue tasks
export function useOverdueTasks(userId?: string) {
  return useQuery({
    queryKey: taskKeys.overdue(userId),
    queryFn: () => getOverdueTasks(userId),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Fetch upcoming tasks
export function useUpcomingTasks(userId?: string) {
  return useQuery({
    queryKey: taskKeys.upcoming(userId),
    queryFn: () => getUpcomingTasks(userId),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Fetch task counts
export function useTaskCounts(userId?: string) {
  return useQuery({
    queryKey: taskKeys.counts(userId),
    queryFn: () => getTaskCounts(userId),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: TaskInsert) => createTask(task),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      if (data.lead_id) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byLead(data.lead_id) })
      }
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TaskUpdate }) =>
      updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Complete task mutation
export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onMutate: async (taskId) => {
      // Optimistically update the task status
      await queryClient.cancelQueries({ queryKey: taskKeys.all })

      // Get all task queries and update them
      const queries = queryClient.getQueriesData<TaskWithRelations[]>({
        queryKey: taskKeys.all,
      })

      queries.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(
            queryKey,
            data.map((task) =>
              task.id === taskId
                ? { ...task, status: "completed", completed_at: new Date().toISOString() }
                : task
            )
          )
        }
      })

      return { queries }
    },
    onError: (_err, _taskId, context) => {
      // Rollback on error
      context?.queries.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data)
        }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Cancel task mutation
export function useCancelTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => cancelTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
