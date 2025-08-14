import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import PaymentForm from "@/components/payments/payment-form"

interface PaymentPageProps {
  params: {
    installmentId: string
  }
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { data: installment, error } = await supabase
    .from("installments")
    .select(`
      *,
      sales (
        id,
        sale_number,
        customers (
          id,
          full_name,
          cpf,
          phone
        )
      )
    `)
    .eq("id", params.installmentId)
    .single()

  if (error || !installment) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Pagamento</h1>
        <p className="text-gray-600">
          Parcela {installment.installment_number} - {installment.sales.customers.full_name}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <PaymentForm installment={installment} />
      </div>
    </div>
  )
}
