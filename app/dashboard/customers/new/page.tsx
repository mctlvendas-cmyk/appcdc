"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/supabase"

export default function NewCustomerPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    cpf: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    credit_limit: "",
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

    setIsLoading(true)
    setError("")

    try {
      // Validate required fields
      if (!formData.full_name || !formData.cpf || !formData.phone) {
        setError("Por favor, preencha todos os campos obrigatórios.")
        return
      }

      // Validate CPF
      if (!validateCPF(formData.cpf)) {
        setError("CPF inválido.")
        return
      }

      // Check if CPF already exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("cpf", formData.cpf.replace(/\D/g, ""))
        .single()

      if (existingCustomer) {
        setError("Já existe um cliente cadastrado com este CPF.")
        return
      }

      // Prepare customer data
      const customerData = {
        user_id: user.id,
        full_name: formData.full_name.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        credit_limit: formData.credit_limit ? Number.parseFloat(formData.credit_limit) : 0,
        current_debt: 0,
        active: true,
      }

      // Insert customer
      const { error: insertError } = await supabase.from("customers").insert([customerData])

      if (insertError) {
        console.error("Error inserting customer:", insertError)
        setError("Erro ao cadastrar cliente. Tente novamente.")
        return
      }

      // Success
      router.push("/dashboard/customers")
    } catch (error) {
      console.error("Error creating customer:", error)
      setError("Erro ao cadastrar cliente. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    let formattedValue = value

    // Apply formatting
    if (name === "cpf") {
      formattedValue = formatCPF(value)
    } else if (name === "phone") {
      formattedValue = formatPhone(value)
    } else if (name === "full_name") {
      formattedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }))
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
        <p className="text-gray-600 mt-2">Cadastre um novo cliente no sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

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

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="São Paulo" />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="credit_limit">Limite de Crédito (R$)</Label>
                <Input
                  id="credit_limit"
                  name="credit_limit"
                  type="number"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  placeholder="1000.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/customers")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Cliente"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
