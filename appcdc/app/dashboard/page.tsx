"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

interface DashboardStats {
  totalCustomers: number
  activeSales: number
  totalValue: number
  overdue: number
}

interface RecentSale {
  id: string
  customer_name: string
  sale_number: string
  total_amount: number
  installments: number
}

interface PendingPayment {
  id: string
  customer_name: string
  due_date: string
  amount: number
  status: "overdue" | "due_today" | "upcoming"
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeSales: 0,
    totalValue: 0,
    overdue: 0,
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      // Load stats
      const [customersResult, salesResult, installmentsResult] = await Promise.all([
        // Total customers
        supabase
          .from("customers")
          .select("id", { count: "exact" })
          .eq(user.role === "master" ? "id" : "created_by", user.role === "master" ? user.id : user.id),

        // Active sales
        supabase
          .from("sales")
          .select("id, total_amount", { count: "exact" })
          .eq("status", "active")
          .eq(user.role === "master" ? "id" : "created_by", user.role === "master" ? user.id : user.id),

        // Overdue installments
        supabase
          .from("installments")
          .select("id", { count: "exact" })
          .eq("status", "pending")
          .lt("due_date", new Date().toISOString().split("T")[0]),
      ])

      const totalValue = salesResult.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

      setStats({
        totalCustomers: customersResult.count || 0,
        activeSales: salesResult.count || 0,
        totalValue,
        overdue: installmentsResult.count || 0,
      })

      // Load recent sales
      const { data: salesData } = await supabase
        .from("sales")
        .select(`
          id,
          total_amount,
          installments,
          customers!inner(full_name)
        `)
        .eq(user.role === "master" ? "id" : "created_by", user.role === "master" ? user.id : user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      if (salesData) {
        setRecentSales(
          salesData.map((sale, index) => ({
            id: sale.id,
            customer_name: sale.customers.full_name,
            sale_number: `#${String(index + 1).padStart(6, "0")}`,
            total_amount: sale.total_amount,
            installments: sale.installments,
          })),
        )
      }

      // Load pending payments
      const today = new Date().toISOString().split("T")[0]
      const { data: paymentsData } = await supabase
        .from("installments")
        .select(`
          id,
          due_date,
          amount,
          sales!inner(
            customers!inner(full_name)
          )
        `)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(3)

      if (paymentsData) {
        setPendingPayments(
          paymentsData.map((payment) => {
            const dueDate = new Date(payment.due_date)
            const todayDate = new Date(today)
            let status: "overdue" | "due_today" | "upcoming" = "upcoming"

            if (dueDate < todayDate) {
              status = "overdue"
            } else if (dueDate.toDateString() === todayDate.toDateString()) {
              status = "due_today"
            }

            return {
              id: payment.id,
              customer_name: payment.sales.customers.full_name,
              due_date: payment.due_date,
              amount: payment.amount,
              status,
            }
          }),
        )
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "overdue":
        return { label: "Atrasado", color: "bg-red-100 text-red-800" }
      case "due_today":
        return { label: "Vence Hoje", color: "bg-yellow-100 text-yellow-800" }
      default:
        return { label: "Em Dia", color: "bg-green-100 text-green-800" }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard - OC CDC</h1>
        <p className="text-gray-600">Bem-vindo ao sistema de gestão de crediário</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Atraso</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vendas Recentes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.customer_name}</p>
                      <p className="text-sm text-gray-500">Venda {sale.sale_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-sm text-gray-500">{sale.installments}x</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhuma venda recente</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pagamentos Pendentes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingPayments.length > 0 ? (
                pendingPayments.map((payment) => {
                  const statusInfo = getStatusLabel(payment.status)
                  return (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.customer_name}</p>
                        <p className="text-sm text-gray-500">Venc: {formatDate(payment.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${payment.status === "overdue" ? "text-red-600" : payment.status === "due_today" ? "text-yellow-600" : "text-gray-900"}`}
                        >
                          {formatCurrency(payment.amount)}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500">Nenhum pagamento pendente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
