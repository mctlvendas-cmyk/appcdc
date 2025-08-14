"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    id: 1,
    type: "payment",
    description: "Pagamento recebido de João Silva",
    amount: "R$ 250,00",
    time: "2 horas atrás",
    status: "success",
  },
  {
    id: 2,
    type: "sale",
    description: "Nova venda para Maria Santos",
    amount: "R$ 1.200,00",
    time: "4 horas atrás",
    status: "info",
  },
  {
    id: 3,
    type: "overdue",
    description: "Parcela em atraso - Carlos Oliveira",
    amount: "R$ 180,00",
    time: "1 dia atrás",
    status: "warning",
  },
]

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{activity.amount}</span>
                <Badge
                  variant={
                    activity.status === "success"
                      ? "default"
                      : activity.status === "warning"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {activity.status === "success" ? "Pago" : activity.status === "warning" ? "Atraso" : "Nova"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
