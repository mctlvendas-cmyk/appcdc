"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Download,
  Loader2,
  BarChart3,
  PieChartIcon,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/supabase"

interface ReportStats {
  totalCustomers: number
  totalSales: number
  totalRevenue: number
  activeSales: number
  overdueSales: number
  monthlyRevenue: number
  averageTicket: number
  conversionRate: number
}

interface MonthlyData {
  month: string
  sales: number
  revenue: number
  payments: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeSales: 0,
    overdueSales: 0,
    monthlyRevenue: 0,
    averageTicket: 0,
    conversionRate: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    try {
      setLoading(true)

      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("No user found")
        return
      }
      setUser(currentUser)

      // Load all data in parallel
      await Promise.all([loadStats(currentUser), loadMonthlyData(currentUser), loadStatusData(currentUser)])
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (currentUser: User) => {
    try {
      // Base queries with user filtering
      const customerQuery = supabase.from("customers").select("id, credit_limit, current_debt")
      const salesQuery = supabase.from("sales").select("id, total_amount, status, sale_date")
      const installmentsQuery = supabase.from("installments").select("id, amount, status, due_date")

      // Apply user filtering if not master
      if (currentUser.role !== "master") {
        customerQuery.eq("user_id", currentUser.id)
        salesQuery.eq("user_id", currentUser.id)
        // For installments, we need to join with sales
        installmentsQuery.eq("sales.user_id", currentUser.id)
      }

      // Apply date filtering
      salesQuery.gte("sale_date", dateRange.startDate).lte("sale_date", dateRange.endDate)

      const [customersResult, salesResult, installmentsResult] = await Promise.all([
        customerQuery,
        salesQuery,
        installmentsQuery,
      ])

      const customers = customersResult.data || []
      const sales = salesResult.data || []
      const installments = installmentsResult.data || []

      // Calculate stats
      const totalCustomers = customers.length
      const totalSales = sales.length
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const activeSales = sales.filter((sale) => sale.status === "pendente").length
      const overdueSales = sales.filter((sale) => sale.status === "atrasado").length

      // Calculate monthly revenue for current month
      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyRevenue = sales
        .filter((sale) => sale.sale_date.startsWith(currentMonth))
        .reduce((sum, sale) => sum + sale.total_amount, 0)

      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
      const conversionRate = totalCustomers > 0 ? (totalSales / totalCustomers) * 100 : 0

      setStats({
        totalCustomers,
        totalSales,
        totalRevenue,
        activeSales,
        overdueSales,
        monthlyRevenue,
        averageTicket,
        conversionRate,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadMonthlyData = async (currentUser: User) => {
    try {
      let salesQuery = supabase.from("sales").select("sale_date, total_amount")
      let paymentsQuery = supabase.from("payments").select("payment_date, amount")

      // Apply user filtering if not master
      if (currentUser.role !== "master") {
        salesQuery = salesQuery.eq("user_id", currentUser.id)
        paymentsQuery = paymentsQuery.eq("user_id", currentUser.id)
      }

      // Apply date filtering
      salesQuery = salesQuery.gte("sale_date", dateRange.startDate).lte("sale_date", dateRange.endDate)
      paymentsQuery = paymentsQuery.gte("payment_date", dateRange.startDate).lte("payment_date", dateRange.endDate)

      const [salesResult, paymentsResult] = await Promise.all([salesQuery, paymentsQuery])

      const sales = salesResult.data || []
      const payments = paymentsResult.data || []

      // Group by month
      const monthlyMap = new Map<string, { sales: number; revenue: number; payments: number }>()

      // Process sales
      sales.forEach((sale) => {
        const month = new Date(sale.sale_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        const current = monthlyMap.get(month) || { sales: 0, revenue: 0, payments: 0 }
        current.sales += 1
        current.revenue += sale.total_amount
        monthlyMap.set(month, current)
      })

      // Process payments
      payments.forEach((payment) => {
        const month = new Date(payment.payment_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        const current = monthlyMap.get(month) || { sales: 0, revenue: 0, payments: 0 }
        current.payments += payment.amount
        monthlyMap.set(month, current)
      })

      // Convert to array and sort
      const monthlyArray = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      setMonthlyData(monthlyArray)
    } catch (error) {
      console.error("Error loading monthly data:", error)
    }
  }

  const loadStatusData = async (currentUser: User) => {
    try {
      let query = supabase.from("sales").select("status")

      // Apply user filtering if not master
      if (currentUser.role !== "master") {
        query = query.eq("user_id", currentUser.id)
      }

      // Apply date filtering
      query = query.gte("sale_date", dateRange.startDate).lte("sale_date", dateRange.endDate)

      const { data: sales } = await query

      if (!sales) return

      // Count by status
      const statusCounts = sales.reduce(
        (acc, sale) => {
          acc[sale.status] = (acc[sale.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const statusData = [
        { name: "Ativo", value: statusCounts.pendente || 0, color: "#3B82F6" },
        { name: "Pago", value: statusCounts.pago || 0, color: "#10B981" },
        { name: "Atrasado", value: statusCounts.atrasado || 0, color: "#EF4444" },
        { name: "Cancelado", value: statusCounts.cancelado || 0, color: "#6B7280" },
      ].filter((item) => item.value > 0)

      setStatusData(statusData)
    } catch (error) {
      console.error("Error loading status data:", error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const exportReport = () => {
    // Simple CSV export
    const csvData = [
      ["Métrica", "Valor"],
      ["Total de Clientes", stats.totalCustomers.toString()],
      ["Total de Vendas", stats.totalSales.toString()],
      ["Receita Total", formatCurrency(stats.totalRevenue)],
      ["Vendas Ativas", stats.activeSales.toString()],
      ["Vendas em Atraso", stats.overdueSales.toString()],
      ["Receita Mensal", formatCurrency(stats.monthlyRevenue)],
      ["Ticket Médio", formatCurrency(stats.averageTicket)],
      ["Taxa de Conversão", `${stats.conversionRate.toFixed(2)}%`],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600">Análises detalhadas do desempenho do negócio</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadReportData} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
              Vendas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              Em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueSales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(stats.averageTicket)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{stats.conversionRate.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{stats.totalSales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Evolução Mensal
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Status das Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal de Vendas e Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "revenue" || name === "payments") {
                          return [formatCurrency(Number(value)), name === "revenue" ? "Receita" : "Pagamentos"]
                        }
                        return [value, "Vendas"]
                      }}
                    />
                    <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" name="Vendas" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.value} vendas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
