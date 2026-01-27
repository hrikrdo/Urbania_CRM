"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type User = Database["public"]["Tables"]["users"]["Row"]

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const supabase = createClient()

      // Get the authenticated user from auth
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        return null
      }

      // Get the user profile from the users table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: profileError } = await (supabase
        .from("users") as any)
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (profileError) {
        // User might not have a profile yet, return basic auth info
        return {
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.first_name || null,
          last_name: authUser.user_metadata?.last_name || null,
        } as Partial<User>
      }

      return profile as User
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
