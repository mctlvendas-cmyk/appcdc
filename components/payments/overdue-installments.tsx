"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Installment } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign, Calendar, User } from "lucide-react"

interface OverdueInstallmentWithDetails extends Installment {
  sales: {
    id: string
    sale_number: string
    customers: {
      id: string
      full_name: string
      cpf: string
      phone: string
    }
  }
}

export default function OverdueInstallments() {
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverdueInstallments()
  }, [])

  const fetchOverdueInstallments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("installments")
        .select(`
          *,
          sales (
            id,
            sale_number,
            customers (
              id,
              full_name,
              cpf,
              phone
            )
          )
        `)
        .eq("status", "pendente")
        .lt("due_date", today)
        .order("due_date", { ascending: true })

      if (error) throw error
      setOverdueInstallments(data || [])
    } catch (error) {
      console.error("Error fetching overdue installments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return <div className="text-center py-4">Carregando parcelas em atraso...</div>
  }

  if (overdueInstallments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Parcelas em Atraso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">Nenhuma parcela em atraso! 🎉</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Parcelas em Atraso ({overdueInstallments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {overdueInstallments.slice(0, 5).map((installment) => (
            <div
              key={installment.id}
              className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{installment.sales.customers.full_name}</h4>
                  <Badge variant="destructive">{getDaysOverdue(installment.due_date)} dias</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {installment.sales.customers.phone}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(installment.due_date).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    R$ {(installment.amount - installment.paid_amount).toFixed(2)}
                  </div>
                  <div>
                    Parcela {installment.installment_number} - #{installment.sales.sale_number}
                  </div>
                </div>
              </div>
              <Link href={`/dashboard/payments/${installment.id}`}>
                <Button size="sm" className="bg-primary hover:bg-primary-light">
                  Receber
                </Button>
              </Link>
            </div>
          ))}
          {overdueInstallments.length > 5 && (
            <div className="text-center pt-4">
              <p className="text-gray-500">E mais {overdueInstallments.length - 5} parcelas em atraso...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
