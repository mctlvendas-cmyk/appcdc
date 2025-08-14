"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, DollarSign, AlertTriangle, Clock, BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { Installment, Sale, Customer, User } from "@/lib/supabase"

interface InstallmentWithDetails extends Installment {
  sale: Sale & {
    customer: Customer
  }
}

interface PaymentStats {
  totalReceived: number
  totalOverdue: number
  totalPending: number
  totalPayments: number
}

export default function PaymentsPage() {
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    totalOverdue: 0,
    totalPending: 0,
    totalPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentWithDetails | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "dinheiro",
    notes: "",
  })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)

      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("No user found")
        return
      }
      setUser(currentUser)

      // Load installments with sale and customer data based on user role
      let query = supabase.from("installments").select(`
          *,
          sale:sales(
            *,
            customer:customers(*)
          )
        `)

      // If not master, only show own installments
      if (currentUser.role !== "master") {
        query = query.eq("sales.user_id", currentUser.id)
      }

      const { data: installmentsData, error } = await query.order("due_date", { ascending: true })

      if (error) {
        console.error("Error loading installments:", error)
        return
      }

      // Update overdue status
      const today = new Date().toISOString().split("T")[0]
      const updatedInstallments = (installmentsData || []).map((installment) => {
        if (installment.status === "pendente" && installment.due_date < today) {
          return { ...installment, status: "atrasado" as const }
        }
        return installment
      })

      setInstallments(updatedInstallments)
      calculateStats(updatedInstallments)
    } catch (error) {
      console.error("Error loading payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (installmentsData: InstallmentWithDetails[]) => {
    const totalReceived = installmentsData.filter((i) => i.status === "pago").reduce((sum, i) => sum + i.paid_amount, 0)

    const totalOverdue = installmentsData
      .filter((i) => i.status === "atrasado")
      .reduce((sum, i) => sum + (i.amount - i.paid_amount), 0)

    const totalPending = installmentsData.filter((i) => i.status === "pendente").length

    const totalPayments = installmentsData.length

    setStats({
      totalReceived,
      totalOverdue,
      totalPending,
      totalPayments,
    })
  }

  const handlePayment = async () => {
    if (!selectedInstallment || !user) return

    setPaymentLoading(true)
    setError("")

    try {
      const paymentAmount = Number.parseFloat(paymentForm.amount)
      if (paymentAmount <= 0) {
        setError("O valor do pagamento deve ser maior que zero.")
        return
      }

      const remainingAmount = selectedInstallment.amount - selectedInstallment.paid_amount
      if (paymentAmount > remainingAmount) {
        setError(`O valor não pode ser maior que o valor em aberto (R$ ${remainingAmount.toFixed(2)}).`)
        return
      }

      // Create payment record
      const paymentData = {
        installment_id: selectedInstallment.id,
        user_id: user.id,
        amount: paymentAmount,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: paymentForm.paymentMethod,
        notes: paymentForm.notes.trim() || null,
      }

      const { error: paymentError } = await supabase.from("payments").insert([paymentData])

      if (paymentError) {
        console.error("Error creating payment:", paymentError)
        setError("Erro ao registrar pagamento. Tente novamente.")
        return
      }

      // Update installment
      const newPaidAmount = selectedInstallment.paid_amount + paymentAmount
      const newStatus = newPaidAmount >= selectedInstallment.amount ? "pago" : selectedInstallment.status

      const { error: updateError } = await supabase
        .from("installments")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          payment_date: newStatus === "pago" ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", selectedInstallment.id)

      if (updateError) {
        console.error("Error updating installment:", updateError)
        setError("Erro ao atualizar parcela. Tente novamente.")
        return
      }

      // Update customer debt if installment is fully paid
      if (newStatus === "pago") {
        const customer = selectedInstallment.sale.customer
        const newDebt = Math.max(0, customer.current_debt - selectedInstallment.amount)

        await supabase.from("customers").update({ current_debt: newDebt }).eq("id", customer.id)
      }

      // Reset form and reload data
      setPaymentForm({ amount: "", paymentMethod: "dinheiro", notes: "" })
      setSelectedInstallment(null)
      loadPayments()
    } catch (error) {
      console.error("Error processing payment:", error)
      setError("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setPaymentLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800"
      case "atrasado":
        return "bg-red-100 text-red-800"
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pago":
        return "Pago"
      case "atrasado":
        return "Em Atraso"
      case "pendente":
        return "Pendente"
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

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const overdueInstallments = installments.filter((i) => i.status === "atrasado")

  if (loading && installments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-600">Gerencie pagamentos e parcelas em atraso</p>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</div>
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
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
              Total Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Installments */}
      {overdueInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Parcelas em Atraso</CardTitle>
            <p className="text-sm text-gray-600">Parcelas que precisam de atenção imediata</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueInstallments.map((installment) => (
                <div
                  key={installment.id}
                  className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{installment.sale.customer.full_name}</p>
                        <p className="text-sm text-gray-600">
                          Parcela {installment.installment_number} - Vencimento: {formatDate(installment.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(installment.amount - installment.paid_amount)}
                      </p>
                      <p className="text-xs text-red-600">{getDaysOverdue(installment.due_date)} dias em atraso</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInstallment(installment)
                            setPaymentForm({
                              amount: (installment.amount - installment.paid_amount).toString(),
                              paymentMethod: "dinheiro",
                              notes: "",
                            })
                          }}
                        >
                          Registrar Pagamento
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Parcelas</CardTitle>
          <p className="text-sm text-gray-600">Todas as parcelas registradas no sistema</p>
        </CardHeader>
        <CardContent>
          {installments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma parcela encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parcela
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {installments.map((installment) => (
                    <tr key={installment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{installment.sale.customer.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{installment.installment_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(installment.amount)}
                          {installment.paid_amount > 0 && (
                            <div className="text-xs text-green-600">
                              Pago: {formatCurrency(installment.paid_amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(installment.due_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(installment.status)}`}
                        >
                          {getStatusText(installment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {installment.status !== "pago" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInstallment(installment)
                                  setPaymentForm({
                                    amount: (installment.amount - installment.paid_amount).toString(),
                                    paymentMethod: "dinheiro",
                                    notes: "",
                                  })
                                }}
                              >
                                Registrar Pagamento
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!selectedInstallment} onOpenChange={() => setSelectedInstallment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedInstallment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{selectedInstallment.sale.customer.full_name}</p>
                <p className="text-sm text-gray-600 mt-2">Parcela {selectedInstallment.installment_number}</p>
                <p className="font-medium">
                  Valor em aberto: {formatCurrency(selectedInstallment.amount - selectedInstallment.paid_amount)}
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="amount">Valor do Pagamento (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedInstallment.amount - selectedInstallment.paid_amount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o pagamento..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedInstallment(null)}>
                  Cancelar
                </Button>
                <Button onClick={handlePayment} disabled={paymentLoading || !paymentForm.amount}>
                  {paymentLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Registrar Pagamento"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
