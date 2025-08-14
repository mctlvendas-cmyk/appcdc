"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Store, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"

interface MasterDashboardProps {
  user: User
}

interface MasterStats {
  totalUsers: number
  totalStores: number
  totalSales: number
  totalRevenue: number
  overdueAmount: number
  monthlyGrowth: number
}

export default function MasterDashboard({ user }: MasterDashboardProps) {
  const [stats, setStats] = useState<MasterStats>({
    totalUsers: 0,
    totalStores: 0,
    totalSales: 0,
    totalRevenue: 0,
    overdueAmount: 0,
    monthlyGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMasterStats()
  }, [])

  const fetchMasterStats = async () => {
    try {
      // Get total users
      const { data: users } = await supabase.from("users").select("id, role").eq("active", true)
      const totalUsers = users?.length || 0
      const totalStores = users?.filter((u) => u.role === "loja").length || 0

      // Get total sales
      const { data: sales } = await supabase.from("sales").select("total_amount, created_at")
      const totalSales = sales?.length || 0
      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Get overdue amount
      const today = new Date().toISOString().split("T")[0]
      const { data: overdueInstallments } = await supabase
        .from("installments")
        .select("amount, paid_amount")
        .eq("status", "pendente")
        .lt("due_date", today)

      const overdueAmount = overdueInstallments?.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0) || 0

      // Calculate monthly growth (simplified)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const currentMonthSales = sales?.filter((sale) => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
      })
      const monthlyGrowth =
        ((currentMonthSales?.length || 0) / Math.max(totalSales - (currentMonthSales?.length || 0), 1)) * 100

      setStats({
        totalUsers,
        totalStores,
        totalSales,
        totalRevenue,
        overdueAmount,
        monthlyGrowth,
      })
    } catch (error) {
      console.error("Error fetching master stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const masterStats = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Lojas Ativas",
      value: stats.totalStores.toString(),
      icon: Store,
      color: "text-green-600",
    },
    {
      title: "Total de Vendas",
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      color: "text-purple-600",
    },
    {
      title: "Receita Total",
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Crescimento Mensal",
      value: `${stats.monthlyGrowth.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Valor em Atraso",
      value: `R$ ${stats.overdueAmount.toFixed(2)}`,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  if (loading) {
    return <div className="text-center py-8">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Master</h1>
          <p className="text-gray-600">Bem-vindo, {user.full_name}</p>
        </div>
        <Badge variant="destructive" className="text-sm">
          Administrador
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Usuários Ativos:</span>
                <span className="font-semibold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Lojas Cadastradas:</span>
                <span className="font-semibold">{stats.totalStores}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vendas Realizadas:</span>
                <span className="font-semibold">{stats.totalSales}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600">Receita Total:</span>
                <span className="font-semibold text-green-600">R$ {stats.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.overdueAmount > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 text-sm font-medium">
                    R$ {stats.overdueAmount.toFixed(2)} em parcelas em atraso
                  </p>
                </div>
              )}
              {stats.monthlyGrowth > 10 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">
                    Crescimento de {stats.monthlyGrowth.toFixed(1)}% nas vendas este mês
                  </p>
                </div>
              )}
              {stats.monthlyGrowth < 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm font-medium">
                    Queda de {Math.abs(stats.monthlyGrowth).toFixed(1)}% nas vendas este mês
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
