"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShoppingCart, CreditCard, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total de Clientes",
    value: "1,234",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Vendas do Mês",
    value: "R$ 45.231",
    change: "+8%",
    icon: ShoppingCart,
    color: "text-green-600",
  },
  {
    title: "Pagamentos Pendentes",
    value: "R$ 12.456",
    change: "-3%",
    icon: CreditCard,
    color: "text-yellow-600",
  },
  {
    title: "Taxa de Inadimplência",
    value: "2.4%",
    change: "-0.5%",
    icon: TrendingUp,
    color: "text-red-600",
  },
]

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.change}</span> em
              relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
