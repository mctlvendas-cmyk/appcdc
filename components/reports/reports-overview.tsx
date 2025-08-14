"use client"

import { useState } from "react"
import type { User } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, BarChart3, PieChart, TrendingUp } from "lucide-react"

interface ReportsOverviewProps {
  user: User
}

export default function ReportsOverview({ user }: ReportsOverviewProps) {
  const [reportPeriod, setReportPeriod] = useState("current_month")
  const [loading, setLoading] = useState(false)

  const reportTypes = [
    {
      title: "Relatório de Vendas",
      description: "Vendas realizadas no período selecionado",
      icon: BarChart3,
      type: "sales",
    },
    {
      title: "Relatório de Pagamentos",
      description: "Pagamentos recebidos e pendentes",
      icon: PieChart,
      type: "payments",
    },
    {
      title: "Relatório de Inadimplência",
      description: "Parcelas em atraso e clientes devedores",
      icon: TrendingUp,
      type: "overdue",
    },
    {
      title: "Relatório de Clientes",
      description: "Cadastro e análise de clientes",
      icon: FileText,
      type: "customers",
    },
  ]

  const handleGenerateReport = async (reportType: string) => {
    setLoading(true)
    try {
      // Here you would implement the actual report generation
      // For now, we'll just show a placeholder
      console.log(`Generating ${reportType} report for period ${reportPeriod}`)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real implementation, you would:
      // 1. Fetch data based on reportType and reportPeriod
      // 2. Generate PDF or Excel file
      // 3. Download the file
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mês Atual</SelectItem>
                  <SelectItem value="last_month">Mês Anterior</SelectItem>
                  <SelectItem value="current_quarter">Trimestre Atual</SelectItem>
                  <SelectItem value="current_year">Ano Atual</SelectItem>
                  <SelectItem value="last_year">Ano Anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.type}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <report.icon className="h-5 w-5 mr-2" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              <Button
                onClick={() => handleGenerateReport(report.type)}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-light"
              >
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Selecione um tipo de relatório acima para gerar</p>
            <p className="text-sm">Os relatórios serão gerados em formato PDF</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
