"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, DollarSign, Target, TrendingUp, Calendar } from "lucide-react"

interface VendedorDashboardProps {
  user: User
}

interface VendedorStats {
  monthlySales: number
  monthlyRevenue: number
  todaySales: number
  averageTicket: number
  salesGoal: number
}

export default function VendedorDashboard({ user }: VendedorDashboardProps) {
  const [stats, setStats] = useState<VendedorStats>({
    monthlySales: 0,
    monthlyRevenue: 0,
    todaySales: 0,
    averageTicket: 0,
    salesGoal: 50, // Example goal
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendedorStats()
  }, [])

  const fetchVendedorStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

      // Get monthly sales
      const { data: monthlySales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("user_id", user.id)
        .gte("sale_date", firstDayOfMonth)
      const monthlySalesCount = monthlySales?.length || 0
      const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Get today's sales
      const { data: todaySales } = await supabase
        .from("sales")
        .select("id")
        .eq("user_id", user.id)
        .eq("sale_date", today)
      const todaySalesCount = todaySales?.length || 0

      // Calculate average ticket
      const averageTicket = monthlySalesCount > 0 ? monthlyRevenue / monthlySalesCount : 0

      setStats({
        monthlySales: monthlySalesCount,
        monthlyRevenue,
        todaySales: todaySalesCount,
        averageTicket,
        salesGoal: 50,
      })
    } catch (error) {
      console.error("Error fetching vendedor stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const vendedorStats = [
    {
      title: "Vendas do Mês",
      value: stats.monthlySales.toString(),
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Receita Mensal",
      value: `R$ ${stats.monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Vendas Hoje",
      value: stats.todaySales.toString(),
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  const goalProgress = (stats.monthlySales / stats.salesGoal) * 100

  if (loading) {
    return <div className="text-center py-8">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Vendedor</h1>
          <p className="text-gray-600">Bem-vindo, {user.full_name}</p>
          {user.store_name && <p className="text-sm text-gray-500">{user.store_name}</p>}
        </div>
        <Badge variant="secondary" className="text-sm">
          Vendedor
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vendedorStats.map((stat) => (
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
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Progresso:</span>
                <span className="font-semibold">
                  {stats.monthlySales}/{stats.salesGoal} vendas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(goalProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>0</span>
                <span className="font-medium">{goalProgress.toFixed(1)}%</span>
                <span>{stats.salesGoal}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vendas Realizadas:</span>
                <span className="font-semibold">{stats.monthlySales}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Receita Gerada:</span>
                <span className="font-semibold text-green-600">R$ {stats.monthlyRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ticket Médio:</span>
                <span className="font-semibold">R$ {stats.averageTicket.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600">Status da Meta:</span>
                <Badge variant={goalProgress >= 100 ? "default" : goalProgress >= 75 ? "secondary" : "destructive"}>
                  {goalProgress >= 100 ? "Atingida" : goalProgress >= 75 ? "Próximo" : "Em Andamento"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
