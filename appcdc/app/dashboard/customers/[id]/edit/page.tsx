import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import CustomerForm from "@/components/customers/customer-form"

interface EditCustomerPageProps {
  params: {
    id: string
  }
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", params.id).single()

  if (error || !customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
        <p className="text-gray-600">Atualize as informações do cliente</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <CustomerForm customer={customer} />
      </div>
    </div>
  )
}
