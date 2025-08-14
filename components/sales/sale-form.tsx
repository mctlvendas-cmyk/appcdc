"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Customer } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, ArrowLeft, Calculator } from "lucide-react"
import Link from "next/link"

export default function SaleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [formData, setFormData] = useState({
    customer_id: "",
    total_amount: "",
    down_payment: "",
    installments_count: "12",
    interest_rate: "0",
    sale_date: new Date().toISOString().split("T")[0],
    first_due_date: "",
    description: "",
    notes: "",
  })

  const [calculations, setCalculations] = useState({
    financed_amount: 0,
    installment_value: 0,
    total_with_interest: 0,
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    calculateInstallments()
  }, [formData.total_amount, formData.down_payment, formData.installments_count, formData.interest_rate])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from("customers").select("*").eq("active", true).order("full_name")

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const calculateInstallments = () => {
    const totalAmount = Number.parseFloat(formData.total_amount) || 0
    const downPayment = Number.parseFloat(formData.down_payment) || 0
    const installmentsCount = Number.parseInt(formData.installments_count) || 1
    const interestRate = Number.parseFloat(formData.interest_rate) || 0

    const financedAmount = totalAmount - downPayment

    if (financedAmount <= 0) {
      setCalculations({
        financed_amount: 0,
        installment_value: 0,
        total_with_interest: totalAmount,
      })
      return
    }

    // Calculate installment with compound interest
    let installmentValue: number
    let totalWithInterest: number

    if (interestRate > 0) {
      const monthlyRate = interestRate / 100
      const factor = Math.pow(1 + monthlyRate, installmentsCount)
      installmentValue = (financedAmount * monthlyRate * factor) / (factor - 1)
      totalWithInterest = downPayment + installmentValue * installmentsCount
    } else {
      installmentValue = financedAmount / installmentsCount
      totalWithInterest = totalAmount
    }

    setCalculations({
      financed_amount: financedAmount,
      installment_value: installmentValue,
      total_with_interest: totalWithInterest,
    })
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    setSelectedCustomer(customer || null)
    setFormData((prev) => ({ ...prev, customer_id: customerId }))
  }

  const generateSaleNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const time = String(now.getTime()).slice(-4)
    return `${year}${month}${day}${time}`
  }

  const createInstallments = async (saleId: string) => {
    const installments = []
    const firstDueDate = new Date(formData.first_due_date)

    for (let i = 1; i <= Number.parseInt(formData.installments_count); i++) {
      const dueDate = new Date(firstDueDate)
      dueDate.setMonth(dueDate.getMonth() + (i - 1))

      installments.push({
        sale_id: saleId,
        installment_number: i,
        due_date: dueDate.toISOString().split("T")[0],
        amount: calculations.installment_value,
        status: "pendente",
      })
    }

    const { error } = await supabase.from("installments").insert(installments)
    if (error) throw error
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

      if (!selectedCustomer) throw new Error("Selecione um cliente")

      // Check credit limit
      const availableCredit = selectedCustomer.credit_limit - selectedCustomer.current_debt
      if (calculations.financed_amount > availableCredit) {
        throw new Error(
          `Valor financiado (R$ ${calculations.financed_amount.toFixed(2)}) excede o limite disponível (R$ ${availableCredit.toFixed(2)})`,
        )
      }

      const saleNumber = generateSaleNumber()

      const saleData = {
        user_id: session.user.id,
        customer_id: formData.customer_id,
        sale_number: saleNumber,
        total_amount: Number.parseFloat(formData.total_amount),
        down_payment: Number.parseFloat(formData.down_payment) || 0,
        financed_amount: calculations.financed_amount,
        installments_count: Number.parseInt(formData.installments_count),
        installment_value: calculations.installment_value,
        interest_rate: Number.parseFloat(formData.interest_rate) || 0,
        sale_date: formData.sale_date,
        first_due_date: formData.first_due_date,
        description: formData.description,
        notes: formData.notes,
        status: "pendente",
      }

      // Create sale
      const { data: sale, error: saleError } = await supabase.from("sales").insert([saleData]).select().single()

      if (saleError) throw saleError

      // Create installments
      await createInstallments(sale.id)

      // Update customer debt
      const { error: customerError } = await supabase
        .from("customers")
        .update({
          current_debt: selectedCustomer.current_debt + calculations.financed_amount,
        })
        .eq("id", formData.customer_id)

      if (customerError) throw customerError

      router.push(`/dashboard/sales/${sale.id}`)
    } catch (err: any) {
      setError(err.message || "Erro ao criar venda")
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
        <Link href="/dashboard/sales">
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
              <CardTitle>Informações da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer_id">Cliente *</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name} - {customer.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Limite:</strong> R$ {selectedCustomer.credit_limit.toFixed(2)} | <strong>Dívida:</strong> R${" "}
                    {selectedCustomer.current_debt.toFixed(2)} | <strong>Disponível:</strong> R${" "}
                    {(selectedCustomer.credit_limit - selectedCustomer.current_debt).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sale_date">Data da Venda *</Label>
                  <Input
                    id="sale_date"
                    name="sale_date"
                    type="date"
                    value={formData.sale_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="first_due_date">Primeiro Vencimento *</Label>
                  <Input
                    id="first_due_date"
                    name="first_due_date"
                    type="date"
                    value={formData.first_due_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição da Venda</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ex: Móveis para sala"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valores e Parcelamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="total_amount">Valor Total *</Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="down_payment">Entrada</Label>
                <Input
                  id="down_payment"
                  name="down_payment"
                  type="number"
                  step="0.01"
                  value={formData.down_payment}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="installments_count">Número de Parcelas *</Label>
                  <Select
                    value={formData.installments_count}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, installments_count: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="interest_rate">Taxa de Juros (% a.m.)</Label>
                  <Input
                    id="interest_rate"
                    name="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Resumo dos Cálculos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor Financiado:</span>
                <span className="font-medium">R$ {calculations.financed_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor da Parcela:</span>
                <span className="font-medium text-blue-600">R$ {calculations.installment_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Total com Juros:</span>
                <span className="font-semibold text-green-600">R$ {calculations.total_with_interest.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Link href="/dashboard/sales">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={loading || !formData.customer_id} className="bg-primary hover:bg-primary-light">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando Venda...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Criar Venda
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
