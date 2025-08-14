"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { Sale, Customer, User } from "@/lib/supabase"

interface SaleWithCustomer extends Sale {
  customer: Customer
}

interface SalesStats {
  totalSales: number
  totalValue: number
  activeSales: number
  overdueSales: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleWithCustomer[]>([])
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalValue: 0,
    activeSales: 0,
    overdueSales: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      setLoading(true)

      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("No user found")
        return
      }
      setUser(currentUser)

      // Load sales with customer data based on user role
      let query = supabase.from("sales").select(`
          *,
          customer:customers(*)
        `)

      // If not master, only show own sales
      if (currentUser.role !== "master") {
        query = query.eq("user_id", currentUser.id)
      }

      const { data: salesData, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading sales:", error)
        return
      }

      setSales(salesData || [])
      calculateStats(salesData || [])
    } catch (error) {
      console.error("Error loading sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (salesData: SaleWithCustomer[]) => {
    const totalSales = salesData.length
    const totalValue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0)
    const activeSales = salesData.filter((sale) => sale.status === "pendente").length
    const overdueSales = salesData.filter((sale) => sale.status === "atrasado").length

    setStats({
      totalSales,
      totalValue,
      activeSales,
      overdueSales,
    })
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadSales()
      return
    }

    try {
      setLoading(true)

      const currentUser = await getCurrentUser()
      if (!currentUser) return

      let query = supabase
        .from("sales")
        .select(`
          *,
          customer:customers(*)
        `)
        .or(`description.ilike.%${searchTerm}%,customers.full_name.ilike.%${searchTerm}%`)

      if (currentUser.role !== "master") {
        query = query.eq("user_id", currentUser.id)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error searching sales:", error)
        return
      }

      setSales(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error("Error searching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "text-blue-600 bg-blue-100"
      case "pago":
        return "text-green-600 bg-green-100"
      case "atrasado":
        return "text-red-600 bg-red-100"
      case "cancelado":
        return "text-gray-600 bg-gray-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Ativo"
      case "pago":
        return "Quitado"
      case "atrasado":
        return "Em Atraso"
      case "cancelado":
        return "Cancelado"
      default:
        return status
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

  if (loading && sales.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600">Gerencie suas vendas e parcelamentos</p>
        </div>
        <Link href="/dashboard/sales/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Vendas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueSales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente ou produto..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Buscar
        </Button>
      </div>

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhuma venda encontrada.</p>
              <Link href="/dashboard/sales/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Venda
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Produto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Valor Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Parcelas</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data da Venda</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{sale.customer.full_name}</td>
                      <td className="py-3 px-4 text-gray-600">{sale.description || "Venda"}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(sale.total_amount)}</td>
                      <td className="py-3 px-4">{sale.installments_count}x</td>
                      <td className="py-3 px-4">{formatDate(sale.sale_date)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {getStatusText(sale.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/sales/${sale.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
