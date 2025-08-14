import { supabase } from "@/lib/supabase"
import type { User, UserRole } from "@/lib/supabase"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session:", sessionError)
      return null
    }

    if (!session?.user) {
      return null
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error getting user data:", userError)
      return null
    }

    return userData
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    vendedor: 1,
    loja: 2,
    master: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole> = {
    "/dashboard": "vendedor",
    "/dashboard/customers": "loja",
    "/dashboard/sales": "vendedor",
    "/dashboard/payments": "loja",
    "/dashboard/reports": "loja",
    "/dashboard/users": "master",
    "/dashboard/settings": "loja",
  }

  const requiredRole = routePermissions[route]
  if (!requiredRole) return true

  return hasPermission(userRole, requiredRole)
}
