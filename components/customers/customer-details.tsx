"use client"

import Link from "next/link"
import type { Customer } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Phone, MapPin, Briefcase, CreditCard } from "lucide-react"

interface CustomerDetailsProps {
  customer: Customer
}

export default function CustomerDetails({ customer }: CustomerDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/customers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
            <p className="text-gray-600">CPF: {customer.cpf}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={customer.current_debt > 0 ? "destructive" : "default"}>
            {customer.current_debt > 0 ? "Devendo" : "Em dia"}
          </Badge>
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Button className="bg-primary hover:bg-primary-light">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Telefone:</span>
              <p className="font-medium">{customer.phone}</p>
            </div>
            {customer.email && (
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{customer.email}</p>
              </div>
            )}
            {customer.birth_date && (
              <div>
                <span className="text-sm text-gray-500">Data de Nascimento:</span>
                <p className="font-medium">{new Date(customer.birth_date).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Endereço:</span>
              <p className="font-medium">{customer.address}</p>
            </div>
            {customer.neighborhood && (
              <div>
                <span className="text-sm text-gray-500">Bairro:</span>
                <p className="font-medium">{customer.neighborhood}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500">Cidade/Estado:</span>
              <p className="font-medium">
                {customer.city}, {customer.state}
              </p>
            </div>
            {customer.zip_code && (
              <div>
                <span className="text-sm text-gray-500">CEP:</span>
                <p className="font-medium">{customer.zip_code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Limite de Crédito:</span>
              <p className="font-medium text-green-600">R$ {customer.credit_limit.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Dívida Atual:</span>
              <p className="font-medium text-red-600">R$ {customer.current_debt.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Crédito Disponível:</span>
              <p className="font-medium text-blue-600">
                R$ {(customer.credit_limit - customer.current_debt).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {(customer.occupation || customer.monthly_income) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.occupation && (
                <div>
                  <span className="text-sm text-gray-500">Profissão:</span>
                  <p className="font-medium">{customer.occupation}</p>
                </div>
              )}
              {customer.monthly_income && (
                <div>
                  <span className="text-sm text-gray-500">Renda Mensal:</span>
                  <p className="font-medium">R$ {customer.monthly_income.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(customer.reference_name || customer.reference_phone) && (
          <Card>
            <CardHeader>
              <CardTitle>Referências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.reference_name && (
                <div>
                  <span className="text-sm text-gray-500">Nome:</span>
                  <p className="font-medium">{customer.reference_name}</p>
                </div>
              )}
              {customer.reference_phone && (
                <div>
                  <span className="text-sm text-gray-500">Telefone:</span>
                  <p className="font-medium">{customer.reference_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {customer.notes && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{customer.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
