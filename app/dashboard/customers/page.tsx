"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Phone, Mail, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { Customer, User } from "@/lib/supabase"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)

      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("No user found")
        return
      }
      setUser(currentUser)

      // Load customers based on user role
      let query = supabase.from("customers").select("*")

      // If not master, only show own customers
      if (currentUser.role !== "master") {
        query = query.eq("user_id", currentUser.id)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading customers:", error)
        return
      }

      setCustomers(data || [])
    } catch (error) {
      console.error("Error loading customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCustomers()
      return
    }

    try {
      setLoading(true)

      const currentUser = await getCurrentUser()
      if (!currentUser) return

      let query = supabase
        .from("customers")
        .select("*")
        .or(`full_name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)

      if (currentUser.role !== "master") {
        query = query.eq("user_id", currentUser.id)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error searching customers:", error)
        return
      }

      setCustomers(data || [])
    } catch (error) {
      console.error("Error searching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e informações de crédito</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar clientes por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Buscar
          </Button>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>
          <p className="text-sm text-gray-600">{customers.length} clientes cadastrados</p>
        </div>

        {customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum cliente encontrado.</p>
            <Link href="/dashboard/customers/new">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Cliente
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <div key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{customer.full_name}</h3>
                        <p className="text-sm text-gray-600">CPF: {formatCPF(customer.cpf)}</p>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {customer.email}
                          </div>
                        )}
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {customer.city}, {customer.state}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center space-x-6">
                      <div className="text-sm">
                        <span className="text-gray-600">Limite: </span>
                        <span className="font-semibold text-green-600">{formatCurrency(customer.credit_limit)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Dívida: </span>
                        <span
                          className={`font-semibold ${customer.current_debt > 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatCurrency(customer.current_debt)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Status: </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {customer.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/customers/${customer.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                    <Link href={`/dashboard/customers/${customer.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
