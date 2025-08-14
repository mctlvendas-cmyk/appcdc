"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calculator, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { Customer, User } from "@/lib/supabase"

export default function NewSalePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    totalValue: "",
    installments: "1",
    interestRate: "2.5",
    firstDueDate: "",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)

      // Load customers based on user role
      let query = supabase.from("customers").select("*").eq("active", true)

      // If not master, only show own customers
      if (currentUser.role !== "master") {
        query = query.eq("user_id", currentUser.id)
      }

      const { data, error } = await query.order("full_name", { ascending: true })

      if (error) {
        console.error("Error loading customers:", error)
        setError("Erro ao carregar clientes.")
        return
      }

      setCustomers(data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Erro ao carregar dados.")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateInstallmentValue = () => {
    const total = Number.parseFloat(formData.totalValue) || 0
    const installments = Number.parseInt(formData.installments) || 1
    const rate = Number.parseFloat(formData.interestRate) || 0

    if (total > 0 && installments > 0) {
      // Cálculo com juros compostos
      const monthlyRate = rate / 100
      if (monthlyRate === 0) {
        return total / installments
      }
      const totalWithInterest = total * Math.pow(1 + monthlyRate, installments)
      const installmentValue = totalWithInterest / installments
      return installmentValue
    }
    return 0
  }

  const generateSaleNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const time = String(now.getTime()).slice(-6)
    return `${year}${month}${day}${time}`
  }

  const createInstallments = async (
    saleId: string,
    totalAmount: number,
    installmentsCount: number,
    firstDueDate: string,
  ) => {
    const installmentValue = calculateInstallmentValue()
    const installments = []

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date(firstDueDate)
      dueDate.setMonth(dueDate.getMonth() + (i - 1))

      installments.push({
        sale_id: saleId,
        installment_number: i,
        due_date: dueDate.toISOString().split("T")[0],
        amount: installmentValue,
        paid_amount: 0,
        late_fee: 0,
        discount: 0,
        status: "pendente" as const,
      })
    }

    const { error } = await supabase.from("installments").insert(installments)
    if (error) {
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError("")

    try {
      // Validate required fields
      if (!formData.customerId || !formData.description || !formData.totalValue) {
        setError("Por favor, preencha todos os campos obrigatórios.")
        return
      }

      const totalValue = Number.parseFloat(formData.totalValue)
      const installmentsCount = Number.parseInt(formData.installments)

      if (totalValue <= 0) {
        setError("O valor total deve ser maior que zero.")
        return
      }

      // Get selected customer
      const selectedCustomer = customers.find((c) => c.id === formData.customerId)
      if (!selectedCustomer) {
        setError("Cliente não encontrado.")
        return
      }

      // Check credit limit
      const availableCredit = selectedCustomer.credit_limit - selectedCustomer.current_debt
      if (totalValue > availableCredit) {
        setError(`Valor excede o limite de crédito disponível (R$ ${availableCredit.toFixed(2)}).`)
        return
      }

      // Set first due date if not provided
      let firstDueDate = formData.firstDueDate
      if (!firstDueDate) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        firstDueDate = nextMonth.toISOString().split("T")[0]
      }

      const installmentValue = calculateInstallmentValue()
      const financedAmount = totalValue
      const interestRate = Number.parseFloat(formData.interestRate) || 0

      // Create sale
      const saleData = {
        user_id: user.id,
        customer_id: formData.customerId,
        sale_number: generateSaleNumber(),
        total_amount: totalValue,
        down_payment: 0,
        financed_amount: financedAmount,
        installments_count: installmentsCount,
        installment_value: installmentValue,
        interest_rate: interestRate,
        sale_date: new Date().toISOString().split("T")[0],
        first_due_date: firstDueDate,
        description: formData.description.trim(),
        notes: formData.notes.trim() || null,
        status: "pendente" as const,
      }

      const { data: saleResult, error: saleError } = await supabase.from("sales").insert([saleData]).select().single()

      if (saleError) {
        console.error("Error creating sale:", saleError)
        setError("Erro ao criar venda. Tente novamente.")
        return
      }

      // Create installments
      await createInstallments(saleResult.id, totalValue, installmentsCount, firstDueDate)

      // Update customer debt
      const newDebt = selectedCustomer.current_debt + totalValue
      const { error: updateError } = await supabase
        .from("customers")
        .update({ current_debt: newDebt })
        .eq("id", formData.customerId)

      if (updateError) {
        console.error("Error updating customer debt:", updateError)
        // Don't fail the sale creation for this
      }

      // Success
      router.push("/dashboard/sales")
    } catch (error) {
      console.error("Error creating sale:", error)
      setError("Erro ao criar venda. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCustomer = customers.find((c) => c.id === formData.customerId)
  const installmentValue = calculateInstallmentValue()
  const totalWithInterest = installmentValue * Number.parseInt(formData.installments || "1")

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
          <p className="text-gray-600">Registre uma nova venda com parcelamento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="customer">Cliente *</Label>
                <Select value={formData.customerId} onValueChange={(value) => handleInputChange("customerId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name} - Disponível: R${" "}
                        {(customer.credit_limit - customer.current_debt).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <p className="text-sm text-gray-600 mt-1">
                    Limite: R$ {selectedCustomer.credit_limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} |
                    Dívida: R$ {selectedCustomer.current_debt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Produto/Serviço *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Ex: Smartphone Galaxy S23"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalValue">Valor Total (R$) *</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalValue}
                    onChange={(e) => handleInputChange("totalValue", e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="installments">Número de Parcelas *</Label>
                  <Select
                    value={formData.installments}
                    onValueChange={(value) => handleInputChange("installments", value)}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate">Taxa de Juros (% ao mês)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.interestRate}
                    onChange={(e) => handleInputChange("interestRate", e.target.value)}
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <Label htmlFor="firstDueDate">Primeiro Vencimento</Label>
                  <Input
                    id="firstDueDate"
                    type="date"
                    value={formData.firstDueDate}
                    onChange={(e) => handleInputChange("firstDueDate", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Informações adicionais sobre a venda..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo da Venda */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Original:</span>
                  <span className="font-medium">
                    R${" "}
                    {Number.parseFloat(formData.totalValue || "0").toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parcelas:</span>
                  <span className="font-medium">{formData.installments}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Juros:</span>
                  <span className="font-medium">{formData.interestRate}% a.m.</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor da Parcela:</span>
                  <span className="font-bold text-primary">
                    R$ {installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total com Juros:</span>
                  <span className="font-bold text-green-600">
                    R$ {totalWithInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || !formData.customerId || !formData.description || !formData.totalValue}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar Venda"
              )}
            </Button>
            <Link href="/dashboard/sales" className="block">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
