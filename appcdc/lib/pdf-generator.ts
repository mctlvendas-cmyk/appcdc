import jsPDF from "jspdf"
import type { Sale, Customer, Installment } from "@/lib/supabase"

interface ContractData {
  sale: Sale & {
    customers: Customer
    installments: Installment[]
  }
  user: {
    full_name: string
    store_name?: string
    address?: string
    phone?: string
  }
}

export function generateContract(data: ContractData): jsPDF {
  const doc = new jsPDF()
  const { sale, user } = data

  // Set font
  doc.setFont("helvetica")

  // Header
  doc.setFontSize(20)
  doc.setTextColor(13, 71, 161) // Primary blue color
  doc.text("CONTRATO DE COMPRA E VENDA A PRAZO", 105, 20, { align: "center" })

  // Contract number and date
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Contrato Nº: ${sale.sale_number}`, 20, 35)
  doc.text(`Data: ${new Date(sale.sale_date).toLocaleDateString("pt-BR")}`, 150, 35)

  // Seller information
  doc.setFontSize(14)
  doc.setTextColor(13, 71, 161)
  doc.text("VENDEDOR:", 20, 50)

  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  let yPos = 60
  doc.text(`Nome: ${user.full_name}`, 20, yPos)
  if (user.store_name) {
    yPos += 7
    doc.text(`Loja: ${user.store_name}`, 20, yPos)
  }
  if (user.address) {
    yPos += 7
    doc.text(`Endereço: ${user.address}`, 20, yPos)
  }
  if (user.phone) {
    yPos += 7
    doc.text(`Telefone: ${user.phone}`, 20, yPos)
  }

  // Customer information
  yPos += 15
  doc.setFontSize(14)
  doc.setTextColor(13, 71, 161)
  doc.text("COMPRADOR:", 20, yPos)

  yPos += 10
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Nome: ${sale.customers.full_name}`, 20, yPos)
  yPos += 7
  doc.text(`CPF: ${sale.customers.cpf}`, 20, yPos)
  if (sale.customers.rg) {
    yPos += 7
    doc.text(`RG: ${sale.customers.rg}`, 20, yPos)
  }
  yPos += 7
  doc.text(`Telefone: ${sale.customers.phone}`, 20, yPos)
  if (sale.customers.email) {
    yPos += 7
    doc.text(`Email: ${sale.customers.email}`, 20, yPos)
  }
  yPos += 7
  doc.text(`Endereço: ${sale.customers.address}`, 20, yPos)
  yPos += 7
  doc.text(`Cidade: ${sale.customers.city} - ${sale.customers.state}`, 20, yPos)

  // Sale details
  yPos += 15
  doc.setFontSize(14)
  doc.setTextColor(13, 71, 161)
  doc.text("DETALHES DA VENDA:", 20, yPos)

  yPos += 10
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  if (sale.description) {
    doc.text(`Produto/Serviço: ${sale.description}`, 20, yPos)
    yPos += 7
  }
  doc.text(`Valor Total: R$ ${sale.total_amount.toFixed(2)}`, 20, yPos)
  yPos += 7
  doc.text(`Entrada: R$ ${sale.down_payment.toFixed(2)}`, 20, yPos)
  yPos += 7
  doc.text(`Valor Financiado: R$ ${sale.financed_amount.toFixed(2)}`, 20, yPos)
  yPos += 7
  doc.text(`Número de Parcelas: ${sale.installments_count}`, 20, yPos)
  yPos += 7
  doc.text(`Valor da Parcela: R$ ${sale.installment_value.toFixed(2)}`, 20, yPos)
  if (sale.interest_rate > 0) {
    yPos += 7
    doc.text(`Taxa de Juros: ${sale.interest_rate}% a.m.`, 20, yPos)
  }
  yPos += 7
  doc.text(`Primeiro Vencimento: ${new Date(sale.first_due_date).toLocaleDateString("pt-BR")}`, 20, yPos)

  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  } else {
    yPos += 15
  }

  // Installment schedule
  doc.setFontSize(14)
  doc.setTextColor(13, 71, 161)
  doc.text("CRONOGRAMA DE PAGAMENTOS:", 20, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  // Table header
  doc.text("Parcela", 20, yPos)
  doc.text("Vencimento", 60, yPos)
  doc.text("Valor", 120, yPos)
  doc.text("Status", 160, yPos)

  yPos += 5
  doc.line(20, yPos, 190, yPos) // Header line

  // Installments
  sale.installments.forEach((installment, index) => {
    yPos += 7
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }

    doc.text(`${installment.installment_number}`, 20, yPos)
    doc.text(new Date(installment.due_date).toLocaleDateString("pt-BR"), 60, yPos)
    doc.text(`R$ ${installment.amount.toFixed(2)}`, 120, yPos)
    doc.text(installment.status === "pago" ? "Pago" : "Pendente", 160, yPos)
  })

  // Check if we need a new page for terms
  if (yPos > 200) {
    doc.addPage()
    yPos = 20
  } else {
    yPos += 20
  }

  // Terms and conditions
  doc.setFontSize(14)
  doc.setTextColor(13, 71, 161)
  doc.text("TERMOS E CONDIÇÕES:", 20, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const terms = [
    "1. O comprador se compromete a efetuar o pagamento das parcelas nas datas estabelecidas.",
    "2. Em caso de atraso no pagamento, será cobrada multa de 2% sobre o valor da parcela.",
    "3. Após 30 dias de atraso, o contrato poderá ser rescindido e o produto retomado.",
    "4. O comprador declara estar ciente de todas as condições deste contrato.",
    "5. Este contrato é válido em todo território nacional.",
    "6. Foro da comarca local para dirimir questões oriundas deste contrato.",
  ]

  terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, 170)
    doc.text(lines, 20, yPos)
    yPos += lines.length * 5 + 3
  })

  // Signatures
  yPos += 20
  if (yPos > 250) {
    doc.addPage()
    yPos = 50
  }

  doc.setFontSize(12)
  doc.text("_".repeat(30), 30, yPos)
  doc.text("_".repeat(30), 130, yPos)
  yPos += 7
  doc.text("Vendedor", 30, yPos)
  doc.text("Comprador", 130, yPos)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    105,
    285,
    {
      align: "center",
    },
  )

  return doc
}

export function downloadContract(data: ContractData): void {
  const doc = generateContract(data)
  doc.save(`contrato-${data.sale.sale_number}.pdf`)
}

export function getContractBlob(data: ContractData): Blob {
  const doc = generateContract(data)
  return doc.output("blob")
}
