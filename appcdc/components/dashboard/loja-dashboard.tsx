"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ShoppingCart, DollarSign, AlertTriangle, Calendar, TrendingUp } from "lucide-react"
import RecentActivity from "@/components/dashboard/recent-activity"

interface LojaDashboardProps {
  user: User
}

interface LojaStats {
  totalCustomers: number
  monthlySales: number
  monthlyRevenue: number
  overdueAmount: number
  overdueCount: number
  todayPayments: number
}

export default function LojaDashboard({ user }: LojaDashboardProps) {
  const [stats, setStats] = useState<LojaStats>({
    totalCustomers: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
    overdueAmount: 0,
    overdueCount: 0,
    todayPayments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLojaStats()
  }, [])

  const fetchLojaStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

      // Get total customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true)
      const totalCustomers = customers?.length || 0

      // Get monthly sales
      const { data: monthlySales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("user_id", user.id)
        .gte("sale_date", firstDayOfMonth)
      const monthlySalesCount = monthlySales?.length || 0
      const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Get overdue installments for user's sales
      const { data: overdueInstallments } = await supabase
        .from("installments")
        .select(`
          amount,
          paid_amount,
          sales!inner (
            user_id
          )
        `)
        .eq("sales.user_id", user.id)
        .eq("status", "pendente")
        .lt("due_date", today)

      const overdueAmount = overdueInstallments?.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0) || 0
      const overdueCount = overdueInstallments?.length || 0

      // Get today's payments
      const { data: todayPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("user_id", user.id)
        .eq("payment_date", today)
      const todayPaymentsAmount = todayPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      setStats({
        totalCustomers,
        monthlySales: monthlySalesCount,
        monthlyRevenue,
        overdueAmount,
        overdueCount,
        todayPayments: todayPaymentsAmount,
      })
    } catch (error) {
      console.error("Error fetching loja stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const lojaStats = [
    {
      title: "Total de Clientes",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-blue-600",
    },
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
      title: "Recebido Hoje",
      value: `R$ ${stats.todayPayments.toFixed(2)}`,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Parcelas em Atraso",
      value: stats.overdueCount.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Valor em Atraso",
      value: `R$ ${stats.overdueAmount.toFixed(2)}`,
      icon: TrendingUp,
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo, {user.full_name}</p>
          {user.store_name && <p className="text-sm text-gray-500">{user.store_name}</p>}
        </div>
        <Badge variant="default" className="text-sm">
          Loja
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lojaStats.map((stat) => (
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

      <RecentActivity />
    </div>
  )
}
