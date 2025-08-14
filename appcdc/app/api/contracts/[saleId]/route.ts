import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateContract } from "@/lib/pdf-generator"

export async function GET(request: NextRequest, { params }: { params: { saleId: string } }) {
  try {
    // Get sale with customer and installments
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(`
        *,
        customers (*),
        installments (*),
        users (
          full_name,
          store_name,
          address,
          phone
        )
      `)
      .eq("id", params.saleId)
      .single()

    if (saleError || !sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Generate PDF
    const doc = generateContract({
      sale: {
        ...sale,
        customers: sale.customers,
        installments: sale.installments.sort((a, b) => a.installment_number - b.installment_number),
      },
      user: sale.users,
    })

    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contrato-${sale.sale_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating contract:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
