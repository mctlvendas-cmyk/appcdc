import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SaleDetails from "@/components/sales/sale-details"

interface SalePageProps {
  params: {
    id: string
  }
}

export default async function SalePage({ params }: SalePageProps) {
  const { data: sale, error } = await supabase
    .from("sales")
    .select(`
      *,
      customers (
        id,
        full_name,
        cpf,
        phone,
        email
      ),
      installments (
        *
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !sale) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <SaleDetails sale={sale} />
    </div>
  )
}
