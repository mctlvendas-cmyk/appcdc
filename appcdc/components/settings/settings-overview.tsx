"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { UserIcon, Bell, Shield, Palette, Database } from "lucide-react"
import { useToast } from "@/components/ui/notification-toast"

interface SettingsOverviewProps {
  user: User
}

export default function SettingsOverview({ user }: SettingsOverviewProps) {
  const { success, error, ToastContainer } = useToast()
  const [loading, setLoading] = useState(false)

  const [profileData, setProfileData] = useState({
    full_name: user.full_name,
    email: user.email,
    phone: user.phone || "",
    store_name: user.store_name || "",
    address: user.address || "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    payment_reminders: true,
    overdue_alerts: true,
    sales_reports: false,
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Here you would update the user profile
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      success("Perfil atualizado", "Suas informações foram salvas com sucesso")
    } catch (err) {
      error("Erro ao atualizar", "Não foi possível salvar as alterações")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)

    try {
      // Here you would update notification settings
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      success("Configurações salvas", "Preferências de notificação atualizadas")
    } catch (err) {
      error("Erro ao salvar", "Não foi possível atualizar as configurações")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_name">Nome da Loja</Label>
                    <Input
                      id="store_name"
                      value={profileData.store_name}
                      onChange={(e) => setProfileData({ ...profileData, store_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-light">
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Notificações por Email</Label>
                  <p className="text-sm text-gray-500">Receber notificações importantes por email</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="payment_reminders">Lembretes de Pagamento</Label>
                  <p className="text-sm text-gray-500">Alertas sobre parcelas próximas do vencimento</p>
                </div>
                <Switch
                  id="payment_reminders"
                  checked={notificationSettings.payment_reminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, payment_reminders: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="overdue_alerts">Alertas de Inadimplência</Label>
                  <p className="text-sm text-gray-500">Notificações sobre parcelas em atraso</p>
                </div>
                <Switch
                  id="overdue_alerts"
                  checked={notificationSettings.overdue_alerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, overdue_alerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sales_reports">Relatórios de Vendas</Label>
                  <p className="text-sm text-gray-500">Receber relatórios mensais por email</p>
                </div>
                <Switch
                  id="sales_reports"
                  checked={notificationSettings.sales_reports}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, sales_reports: checked })
                  }
                />
              </div>

              <Button
                onClick={handleNotificationUpdate}
                disabled={loading}
                className="bg-primary hover:bg-primary-light"
              >
                {loading ? "Salvando..." : "Salvar Preferências"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full bg-transparent">
                Alterar Senha
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Configurar 2FA
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Sessões Ativas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Versão:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Última Atualização:</span>
                  <span className="font-medium">{new Date().toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Função:</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
              </div>

              <Separator />

              <Button variant="outline" className="w-full bg-transparent">
                Backup de Dados
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Exportar Dados
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Aparência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Personalize a aparência do sistema</p>
              <Button variant="outline" className="w-full bg-transparent">
                Modo Escuro (Em Breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
