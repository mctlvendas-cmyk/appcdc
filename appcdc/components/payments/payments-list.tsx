"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Payment } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, DollarSign } from "lucide-react"

interface PaymentWithDetails extends Payment {
  installments: {
    id: string
    installment_number: number
    sales: {
      id: string
      sale_number: string
      customers: {
        id: string
        full_name: string
        cpf: string
      }
    }
  }
}

export default function PaymentsList() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          installments (
            id,
            installment_number,
            sales (
              id,
              sale_number,
              customers (
                id,
                full_name,
                cpf
              )
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.installments.sales.customers.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.installments.sales.sale_number.includes(searchTerm) ||
      payment.installments.sales.customers.cpf.includes(searchTerm),
  )

  if (loading) {
    return <div className="text-center py-8">Carregando pagamentos...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Histórico de Pagamentos
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar pagamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Venda</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.payment_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{payment.installments.sales.customers.full_name}</p>
                    <p className="text-sm text-gray-500">{payment.installments.sales.customers.cpf}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">#{payment.installments.sales.sale_number}</Badge>
                </TableCell>
                <TableCell>{payment.installments.installment_number}</TableCell>
                <TableCell className="font-semibold text-green-600">R$ {payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{payment.payment_method}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredPayments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? "Nenhum pagamento encontrado" : "Nenhum pagamento registrado"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
