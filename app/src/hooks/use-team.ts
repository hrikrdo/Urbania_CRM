"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getUsers,
  getActiveUsers,
  getUser,
  getTeams,
  getTeam,
  getUserMetrics,
  type UserWithRelations,
  type TeamWithMembers,
} from "@/lib/services/team"

export type { UserWithRelations, TeamWithMembers }

// Query keys
export const teamKeys = {
  all: ["team"] as const,
  users: () => [...teamKeys.all, "users"] as const,
  activeUsers: () => [...teamKeys.all, "activeUsers"] as const,
  user: (id: string) => [...teamKeys.all, "user", id] as const,
  teams: () => [...teamKeys.all, "teams"] as const,
  team: (id: string) => [...teamKeys.all, "team", id] as const,
  metrics: () => [...teamKeys.all, "metrics"] as const,
}

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: teamKeys.users(),
    queryFn: getUsers,
  })
}

// Get active users only
export function useActiveUsers() {
  return useQuery({
    queryKey: teamKeys.activeUsers(),
    queryFn: getActiveUsers,
  })
}

// Get single user
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: teamKeys.user(id || ""),
    queryFn: () => (id ? getUser(id) : null),
    enabled: !!id,
  })
}

// Get all teams
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.teams(),
    queryFn: getTeams,
  })
}

// Get single team
export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: teamKeys.team(id || ""),
    queryFn: () => (id ? getTeam(id) : null),
    enabled: !!id,
  })
}

// Get user metrics
export function useUserMetrics() {
  return useQuery({
    queryKey: teamKeys.metrics(),
    queryFn: getUserMetrics,
  })
}
