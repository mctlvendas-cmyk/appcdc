"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { Customer, User } from "@/lib/supabase"

interface CustomerFormProps {
  customer?: Customer
}

export default function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    full_name: customer?.full_name || "",
    cpf: customer?.cpf || "",
    rg: customer?.rg || "",
    birth_date: customer?.birth_date || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    neighborhood: customer?.neighborhood || "",
    city: customer?.city || "",
    state: customer?.state || "",
    zip_code: customer?.zip_code || "",
    occupation: customer?.occupation || "",
    monthly_income: customer?.monthly_income?.toString() || "",
    reference_name: customer?.reference_name || "",
    reference_phone: customer?.reference_phone || "",
    notes: customer?.notes || "",
    credit_limit: customer?.credit_limit?.toString() || "0",
  })

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(currentUser)
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "")
    if (numbers.length !== 11) return false

    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(numbers)) return false

    // Validate CPF algorithm
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(numbers[i]) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(numbers[9])) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(numbers[i]) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    return remainder === Number.parseInt(numbers[10])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Validate required fields
      if (
        !formData.full_name ||
        !formData.cpf ||
        !formData.phone ||
        !formData.address ||
        !formData.city ||
        !formData.state
      ) {
        setError("Por favor, preencha todos os campos obrigatórios.")
        return
      }

      // Validate CPF
      if (!validateCPF(formData.cpf)) {
        setError("CPF inválido.")
        return
      }

      // Check if CPF already exists (only for new customers or if CPF changed)
      if (!customer || customer.cpf !== formData.cpf.replace(/\D/g, "")) {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("cpf", formData.cpf.replace(/\D/g, ""))
          .single()

        if (existingCustomer) {
          setError("Já existe um cliente cadastrado com este CPF.")
          return
        }
      }

      // Prepare customer data
      const customerData = {
        full_name: formData.full_name.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        rg: formData.rg.trim() || null,
        birth_date: formData.birth_date || null,
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email.trim() || null,
        address: formData.address.trim(),
        neighborhood: formData.neighborhood.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zip_code: formData.zip_code.replace(/\D/g, "") || null,
        occupation: formData.occupation.trim() || null,
        monthly_income: formData.monthly_income ? Number.parseFloat(formData.monthly_income) : null,
        reference_name: formData.reference_name.trim() || null,
        reference_phone: formData.reference_phone.replace(/\D/g, "") || null,
        notes: formData.notes.trim() || null,
        credit_limit: formData.credit_limit ? Number.parseFloat(formData.credit_limit) : 0,
      }

      if (customer) {
        // Update existing customer
        const { error: updateError } = await supabase.from("customers").update(customerData).eq("id", customer.id)

        if (updateError) {
          console.error("Error updating customer:", updateError)
          setError("Erro ao atualizar cliente. Tente novamente.")
          return
        }
      } else {
        // Create new customer
        const newCustomerData = {
          ...customerData,
          user_id: user.id,
          current_debt: 0,
          active: true,
        }

        const { error: insertError } = await supabase.from("customers").insert([newCustomerData])

        if (insertError) {
          console.error("Error inserting customer:", insertError)
          setError("Erro ao cadastrar cliente. Tente novamente.")
          return
        }
      }

      // Success
      setSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard/customers")
      }, 2000)
    } catch (error) {
      console.error("Error saving customer:", error)
      setError("Erro ao salvar cliente. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    let formattedValue = value

    // Apply formatting
    if (name === "cpf") {
      formattedValue = formatCPF(value)
    } else if (name === "phone" || name === "reference_phone") {
      formattedValue = formatPhone(value)
    } else if (name === "zip_code") {
      formattedValue = formatCEP(value)
    } else if (name === "full_name" || name === "reference_name") {
      formattedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    } else if (name === "state") {
      formattedValue = value.replace(/[^a-zA-Z]/g, "").toUpperCase()
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente Salvo com Sucesso!</h2>
        <p className="text-gray-600 mb-4">Redirecionando para a lista de clientes...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/customers">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>

          <div>
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input id="rg" name="rg" value={formData.rg} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>

          <div>
            <Label htmlFor="address">Endereço *</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Informações Profissionais</h3>

          <div>
            <Label htmlFor="occupation">Profissão</Label>
            <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="monthly_income">Renda Mensal (R$)</Label>
            <Input
              id="monthly_income"
              name="monthly_income"
              type="number"
              step="0.01"
              min="0"
              value={formData.monthly_income}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="credit_limit">Limite de Crédito (R$)</Label>
            <Input
              id="credit_limit"
              name="credit_limit"
              type="number"
              step="0.01"
              min="0"
              value={formData.credit_limit}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Referências</h3>

          <div>
            <Label htmlFor="reference_name">Nome da Referência</Label>
            <Input id="reference_name" name="reference_name" value={formData.reference_name} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="reference_phone">Telefone da Referência</Label>
            <Input
              id="reference_phone"
              name="reference_phone"
              value={formData.reference_phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Link href="/dashboard/customers">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {customer ? "Atualizar" : "Salvar"} Cliente
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
