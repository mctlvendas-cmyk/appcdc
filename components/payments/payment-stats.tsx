"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar, AlertTriangle, TrendingUp } from "lucide-react"

interface PaymentStatsData {
  totalReceived: number
  overdueAmount: number
  overdueCount: number
  monthlyReceived: number
}

export default function PaymentStats() {
  const [stats, setStats] = useState<PaymentStatsData>({
    totalReceived: 0,
    overdueAmount: 0,
    overdueCount: 0,
    monthlyReceived: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

      // Get total received this month
      const { data: monthlyPayments } = await supabase
        .from("payments")
        .select("amount")
        .gte("payment_date", firstDayOfMonth)

      const monthlyReceived = monthlyPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Get overdue installments
      const { data: overdueInstallments } = await supabase
        .from("installments")
        .select("amount, paid_amount")
        .eq("status", "pendente")
        .lt("due_date", today)

      const overdueAmount = overdueInstallments?.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0) || 0
      const overdueCount = overdueInstallments?.length || 0

      // Get total received all time
      const { data: allPayments } = await supabase.from("payments").select("amount")

      const totalReceived = allPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      setStats({
        totalReceived,
        overdueAmount,
        overdueCount,
        monthlyReceived,
      })
    } catch (error) {
      console.error("Error fetching payment stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      title: "Recebido no Mês",
      value: `R$ ${stats.monthlyReceived.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Recebido",
      value: `R$ ${stats.totalReceived.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Parcelas em Atraso",
      value: stats.overdueCount.toString(),
      icon: Calendar,
      color: "text-red-600",
    },
    {
      title: "Valor em Atraso",
      value: `R$ ${stats.overdueAmount.toFixed(2)}`,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  if (loading) {
    return <div className="text-center py-4">Carregando estatísticas...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
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
  )
}
