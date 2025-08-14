"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Sale } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Calendar, User, DollarSign } from "lucide-react"

interface SaleWithCustomer extends Sale {
  customers: {
    id: string
    full_name: string
    cpf: string
  }
}

export default function SalesList() {
  const [sales, setSales] = useState<SaleWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (
            id,
            full_name,
            cpf
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customers.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customers.cpf.includes(searchTerm),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "default"
      case "pendente":
        return "secondary"
      case "atrasado":
        return "destructive"
      case "cancelado":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pago":
        return "Pago"
      case "pendente":
        return "Pendente"
      case "atrasado":
        return "Atrasado"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando vendas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por número da venda ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Venda #{sale.sale_number}</h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <User className="h-4 w-4 mr-1" />
                    {sale.customers.full_name}
                  </p>
                </div>
                <Badge variant={getStatusColor(sale.status)}>{getStatusLabel(sale.status)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Valor Total:</span>
                  <p className="font-semibold text-lg text-green-600">R$ {sale.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Entrada:</span>
                  <p className="font-medium">R$ {sale.down_payment.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Financiado:</span>
                  <p className="font-medium text-blue-600">R$ {sale.financed_amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Parcelas:</span>
                  <p className="font-medium">
                    {sale.installments_count}x de R$ {sale.installment_value.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(sale.sale_date).toLocaleDateString("pt-BR")}
                </div>
                {sale.interest_rate > 0 && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Juros: {sale.interest_rate}%
                  </div>
                )}
              </div>

              <Link href={`/dashboard/sales/${sale.id}`}>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{searchTerm ? "Nenhuma venda encontrada" : "Nenhuma venda registrada"}</p>
        </div>
      )}
    </div>
  )
}
