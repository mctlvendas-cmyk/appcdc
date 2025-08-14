"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, ShoppingCart, CreditCard, FileText, Settings, LogOut, UserCog } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/auth"

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, requiredRole: "vendedor" as const },
  { name: "Clientes", href: "/dashboard/customers", icon: Users, requiredRole: "loja" as const },
  { name: "Vendas", href: "/dashboard/sales", icon: ShoppingCart, requiredRole: "vendedor" as const },
  { name: "Pagamentos", href: "/dashboard/payments", icon: CreditCard, requiredRole: "loja" as const },
  { name: "Relatórios", href: "/dashboard/reports", icon: FileText, requiredRole: "loja" as const },
  { name: "Usuários", href: "/dashboard/users", icon: UserCog, requiredRole: "master" as const },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings, requiredRole: "loja" as const },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error loading user:", error)
      setUser({
        id: "demo-user",
        email: "admin@oc-cdc.com",
        full_name: "Administrador Master",
        role: "master" as const,
        store_name: "OC - CDC Matriz",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    router.push("/")
  }

  const navigation = user
    ? user.role === "master"
      ? allNavigation // Master vê todos os itens
      : allNavigation.filter((item) => {
          const roleHierarchy = { vendedor: 1, loja: 2, master: 3 }
          const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
          const requiredLevel = roleHierarchy[item.requiredRole] || 0
          return userLevel >= requiredLevel
        })
    : []

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "master":
        return "Administrador"
      case "loja":
        return "Loja"
      case "vendedor":
        return "Vendedor"
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "master":
        return "bg-red-100 text-red-800"
      case "loja":
        return "bg-blue-100 text-blue-800"
      case "vendedor":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading || !user) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:block hidden">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:block hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">OC - CDC</h1>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{user.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
          {user.store_name && <p className="text-xs text-gray-500 mt-2">{user.store_name}</p>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
