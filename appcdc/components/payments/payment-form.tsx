"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Installment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, ArrowLeft, DollarSign, Calendar, User } from "lucide-react"
import Link from "next/link"

interface InstallmentWithDetails extends Installment {
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

interface PaymentFormProps {
  installment: InstallmentWithDetails
}

export default function PaymentForm({ installment }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const remainingAmount = installment.amount - installment.paid_amount
  const isOverdue = new Date(installment.due_date) < new Date()
  const daysOverdue = isOverdue
    ? Math.ceil((new Date().getTime() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const [formData, setFormData] = useState({
    amount: remainingAmount.toString(),
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "dinheiro",
    late_fee: "0",
    discount: "0",
    notes: "",
  })

  const calculateTotal = () => {
    const amount = Number.parseFloat(formData.amount) || 0
    const lateFee = Number.parseFloat(formData.late_fee) || 0
    const discount = Number.parseFloat(formData.discount) || 0
    return amount + lateFee - discount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error("Não autenticado")

      const paymentAmount = Number.parseFloat(formData.amount)
      const lateFee = Number.parseFloat(formData.late_fee) || 0
      const discount = Number.parseFloat(formData.discount) || 0

      if (paymentAmount <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero")
      }

      if (paymentAmount > remainingAmount + lateFee) {
        throw new Error("Valor do pagamento não pode ser maior que o valor restante")
      }

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          installment_id: installment.id,
          user_id: session.user.id,
          amount: paymentAmount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          notes: formData.notes,
        },
      ])

      if (paymentError) throw paymentError

      // Update installment
      const newPaidAmount = installment.paid_amount + paymentAmount
      const newStatus = newPaidAmount >= installment.amount ? "pago" : "pendente"

      const { error: installmentError } = await supabase
        .from("installments")
        .update({
          paid_amount: newPaidAmount,
          payment_date: newStatus === "pago" ? formData.payment_date : installment.payment_date,
          late_fee: lateFee,
          discount: discount,
          status: newStatus,
          notes: formData.notes,
        })
        .eq("id", installment.id)

      if (installmentError) throw installmentError

      // Update customer debt if installment is fully paid
      if (newStatus === "pago") {
        const { data: customer } = await supabase
          .from("customers")
          .select("current_debt")
          .eq("id", installment.sales.customers.id)
          .single()

        if (customer) {
          const newDebt = Math.max(0, customer.current_debt - installment.amount)
          await supabase.from("customers").update({ current_debt: newDebt }).eq("id", installment.sales.customers.id)
        }
      }

      router.push("/dashboard/payments")
    } catch (err: any) {
      setError(err.message || "Erro ao registrar pagamento")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/payments">
          <Button variant="outline" type="button">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações da Parcela
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Cliente:</span>
                  <p className="font-medium">{installment.sales.customers.full_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Venda:</span>
                  <p className="font-medium">#{installment.sales.sale_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Parcela:</span>
                  <p className="font-medium">{installment.installment_number}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Vencimento:</span>
                  <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                    {new Date(installment.due_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {isOverdue && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 text-sm font-medium">Parcela em atraso há {daysOverdue} dias</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Valor Original:</span>
                  <p className="font-medium">R$ {installment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Já Pago:</span>
                  <p className="font-medium text-green-600">R$ {installment.paid_amount.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">Valor Restante:</span>
                <p className="font-semibold text-lg text-blue-600">R$ {remainingAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Dados do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Valor do Pagamento *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  max={remainingAmount}
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_date">Data do Pagamento *</Label>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="late_fee">Multa por Atraso</Label>
                  <Input
                    id="late_fee"
                    name="late_fee"
                    type="number"
                    step="0.01"
                    value={formData.late_fee}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Desconto</Label>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Resumo do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor do Pagamento:</span>
                <span className="font-medium">R$ {(Number.parseFloat(formData.amount) || 0).toFixed(2)}</span>
              </div>
              {Number.parseFloat(formData.late_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Multa por Atraso:</span>
                  <span className="font-medium text-red-600">
                    + R$ {(Number.parseFloat(formData.late_fee) || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {Number.parseFloat(formData.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="font-medium text-green-600">
                    - R$ {(Number.parseFloat(formData.discount) || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">Total a Receber:</span>
                <span className="font-semibold text-lg text-green-600">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Link href="/dashboard/payments">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-light">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Registrar Pagamento
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
