"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Eye, Loader2 } from "lucide-react"

interface ContractGeneratorProps {
  saleId: string
  saleNumber: string
}

export default function ContractGenerator({ saleId, saleNumber }: ContractGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDownloadContract = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/contracts/${saleId}`)

      if (!response.ok) {
        throw new Error("Erro ao gerar contrato")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contrato-${saleNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message || "Erro ao baixar contrato")
    } finally {
      setLoading(false)
    }
  }

  const handleViewContract = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/contracts/${saleId}`)

      if (!response.ok) {
        throw new Error("Erro ao gerar contrato")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || "Erro ao visualizar contrato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Contrato de Venda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-gray-600">
          Gere e baixe o contrato de compra e venda para esta transação. O contrato inclui todos os detalhes da venda,
          cronograma de pagamentos e termos legais.
        </p>

        <div className="flex space-x-3">
          <Button onClick={handleViewContract} disabled={loading} variant="outline" className="flex-1 bg-transparent">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            Visualizar
          </Button>

          <Button
            onClick={handleDownloadContract}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary-light"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Baixar PDF
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• O contrato será gerado com as informações atuais da venda</p>
          <p>• Inclui cronograma completo de pagamentos</p>
          <p>• Documento válido para fins legais</p>
        </div>
      </CardContent>
    </Card>
  )
}
