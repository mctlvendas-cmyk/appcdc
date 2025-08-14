"use client"

import Link from "next/link"
import type { Sale, Installment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, User, Calendar, DollarSign, FileText, CreditCard } from "lucide-react"
import ContractGenerator from "@/components/sales/contract-generator"

interface SaleWithDetails extends Sale {
  customers: {
    id: string
    full_name: string
    cpf: string
    phone: string
    email?: string
  }
  installments: Installment[]
}

interface SaleDetailsProps {
  sale: SaleWithDetails
}

export default function SaleDetails({ sale }: SaleDetailsProps) {
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

  const getInstallmentStatusColor = (status: string, dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)

    if (status === "pago") return "default"
    if (status === "cancelado") return "outline"
    if (due < today && status === "pendente") return "destructive"
    return "secondary"
  }

  const paidInstallments = sale.installments.filter((i) => i.status === "pago").length
  const totalPaid = sale.installments.reduce((sum, i) => sum + i.paid_amount, 0)
  const remainingAmount = sale.financed_amount - totalPaid

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/sales">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Venda #{sale.sale_number}</h1>
            <p className="text-gray-600">{sale.customers.full_name}</p>
          </div>
        </div>

        <Badge variant={getStatusColor(sale.status)} className="text-sm">
          {getStatusLabel(sale.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Total:</span>
              <p className="font-semibold text-lg">R$ {sale.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Entrada:</span>
              <p className="font-medium">R$ {sale.down_payment.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Financiado:</span>
              <p className="font-medium text-blue-600">R$ {sale.financed_amount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Parcelamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Parcelas:</span>
              <p className="font-semibold">
                {sale.installments_count}x de R$ {sale.installment_value.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Juros:</span>
              <p className="font-medium">{sale.interest_rate}% a.m.</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Pagas:</span>
              <p className="font-medium text-green-600">
                {paidInstallments}/{sale.installments_count}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Nome:</span>
              <p className="font-medium">{sale.customers.full_name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">CPF:</span>
              <p className="font-medium">{sale.customers.cpf}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Telefone:</span>
              <p className="font-medium">{sale.customers.phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Venda:</span>
              <p className="font-medium">{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">1º Vencimento:</span>
              <p className="font-medium">{new Date(sale.first_due_date).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Restante:</span>
              <p className="font-medium text-red-600">R$ {remainingAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Parcelas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.installments.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">{installment.installment_number}</TableCell>
                      <TableCell>{new Date(installment.due_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>R$ {installment.amount.toFixed(2)}</TableCell>
                      <TableCell>R$ {installment.paid_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getInstallmentStatusColor(installment.status, installment.due_date)}>
                          {getStatusLabel(installment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {installment.payment_date
                          ? new Date(installment.payment_date).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ContractGenerator saleId={sale.id} saleNumber={sale.sale_number} />

          {(sale.description || sale.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sale.description && (
                  <div>
                    <span className="text-sm text-gray-500">Descrição:</span>
                    <p className="font-medium">{sale.description}</p>
                  </div>
                )}
                {sale.notes && (
                  <div>
                    <span className="text-sm text-gray-500">Observações:</span>
                    <p className="text-gray-700">{sale.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
