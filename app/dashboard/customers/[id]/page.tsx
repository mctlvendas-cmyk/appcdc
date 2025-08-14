import { notFound, redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"
import CustomerDetails from "@/components/customers/customer-details"

interface CustomerPageProps {
  params: {
    id: string
  }
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  if (params.id === "new") {
    redirect("/dashboard/customers/new")
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    notFound()
  }

  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", params.id).single()

  if (error || !customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <CustomerDetails customer={customer} />
    </div>
  )
}
