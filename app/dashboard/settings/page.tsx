"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Bell, Shield, Settings, Link, Loader2, Save, QrCode } from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

interface CompanySettings {
  company_name: string
  cnpj: string
  phone: string
  email: string
  address: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
}

interface SystemSettings {
  default_interest_rate: number
  default_due_days: number
  default_credit_limit: number
}

interface NotificationSettings {
  due_date_notifications: boolean
  payment_notifications: boolean
  monthly_reports: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    default_interest_rate: 2.5,
    default_due_days: 30,
    default_credit_limit: 5000,
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    due_date_notifications: true,
    payment_notifications: true,
    monthly_reports: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [whatsappQR, setWhatsappQR] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const user = await getCurrentUser()
      if (!user) return

      setCurrentUser(user)

      const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (userData) {
        // Load company settings from user data
        setCompanySettings({
          company_name: userData.store_name || "OC - CDC Matriz",
          cnpj: "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
          neighborhood: "",
          city: "",
          state: "",
          zip_code: "",
        })
      }

      // Load system and notification settings from localStorage as fallback
      const savedSystemSettings = localStorage.getItem("oc-cdc-system-settings")
      if (savedSystemSettings) {
        setSystemSettings(JSON.parse(savedSystemSettings))
      }

      const savedNotificationSettings = localStorage.getItem("oc-cdc-notification-settings")
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      setError("Erro ao carregar configurações.")
    } finally {
      setLoading(false)
    }
  }

  const saveCompanySettings = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      if (!currentUser) {
        setError("Usuário não encontrado.")
        return
      }

      // Validate required fields
      if (!companySettings.company_name || !companySettings.email) {
        setError("Nome da empresa e e-mail são obrigatórios.")
        return
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          store_name: companySettings.company_name,
          phone: companySettings.phone,
          email: companySettings.email,
          address: companySettings.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id)

      if (updateError) {
        console.error("Error saving company settings:", updateError)
        setError("Erro ao salvar configurações da empresa.")
        return
      }

      setSuccess("Configurações da empresa salvas com sucesso!")
    } catch (error) {
      console.error("Error saving company settings:", error)
      setError("Erro ao salvar configurações da empresa.")
    } finally {
      setSaving(false)
    }
  }

  const saveSystemSettings = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      localStorage.setItem("oc-cdc-system-settings", JSON.stringify(systemSettings))
      setSuccess("Configurações do sistema salvas com sucesso!")
    } catch (error) {
      console.error("Error saving system settings:", error)
      setError("Erro ao salvar configurações do sistema.")
    } finally {
      setSaving(false)
    }
  }

  const saveNotificationSettings = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      localStorage.setItem("oc-cdc-notification-settings", JSON.stringify(notificationSettings))
      setSuccess("Configurações de notificação salvas com sucesso!")
    } catch (error) {
      console.error("Error saving notification settings:", error)
      setError("Erro ao salvar configurações de notificação.")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      if (!passwordForm.new_password || !passwordForm.confirm_password) {
        setError("Por favor, preencha todos os campos de senha.")
        return
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        setError("As senhas não coincidem.")
        return
      }

      if (passwordForm.new_password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.")
        return
      }

      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      })

      if (error) {
        console.error("Error updating password:", error)
        setError("Erro ao alterar senha.")
        return
      }

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
      setSuccess("Senha alterada com sucesso!")
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Erro ao alterar senha.")
    } finally {
      setSaving(false)
    }
  }

  const generateWhatsAppQR = async () => {
    setSaving(true)
    setError("")

    try {
      // Generate a simple QR code data for WhatsApp Business connection
      const qrData = `whatsapp-business-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // In a real implementation, this would connect to WhatsApp Business API
      // For demo purposes, we'll generate a mock QR code
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`

      setWhatsappQR(qrCodeUrl)
      setSuccess("QR Code gerado! Escaneie com o WhatsApp Business.")
    } catch (error) {
      console.error("Error generating WhatsApp QR:", error)
      setError("Erro ao gerar QR Code do WhatsApp.")
    } finally {
      setSaving(false)
    }
  }

  const handleCompanyAddressFound = (address: {
    street: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }) => {
    setCompanySettings((prev) => ({
      ...prev,
      address: address.street || prev.address,
      neighborhood: address.neighborhood || prev.neighborhood,
      city: address.city || prev.city,
      state: address.state || prev.state,
      zip_code: address.zipCode || prev.zip_code,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={companySettings.cnpj}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Endereço da Empresa</h4>

                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={companySettings.zip_code}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>

                <div>
                  <Label htmlFor="company_address">Endereço Completo</Label>
                  <Input
                    id="company_address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="company_neighborhood">Bairro</Label>
                    <Input
                      id="company_neighborhood"
                      value={companySettings.neighborhood}
                      onChange={(e) => setCompanySettings((prev) => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_city">Cidade</Label>
                    <Input
                      id="company_city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_state">Estado</Label>
                    <Input
                      id="company_state"
                      value={companySettings.state}
                      onChange={(e) => setCompanySettings((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveCompanySettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificações de Vencimento</p>
                    <p className="text-sm text-gray-500">Receber alertas sobre parcelas vencendo</p>
                  </div>
                  <Switch
                    checked={notificationSettings.due_date_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, due_date_notifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificações de Pagamento</p>
                    <p className="text-sm text-gray-500">Receber confirmações de pagamentos</p>
                  </div>
                  <Switch
                    checked={notificationSettings.payment_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, payment_notifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Relatórios Automáticos</p>
                    <p className="text-sm text-gray-500">Enviar relatórios mensais por e-mail</p>
                  </div>
                  <Switch
                    checked={notificationSettings.monthly_reports}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, monthly_reports: checked }))
                    }
                  />
                </div>
              </div>
              <Button onClick={saveNotificationSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
              <Button onClick={changePassword} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="interest_rate">Taxa de Juros Padrão (%)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.1"
                    value={systemSettings.default_interest_rate}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        default_interest_rate: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="due_days">Dias para Vencimento Padrão</Label>
                  <Input
                    id="due_days"
                    type="number"
                    value={systemSettings.default_due_days}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({ ...prev, default_due_days: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="credit_limit">Limite de Crédito Padrão (R$)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={systemSettings.default_credit_limit}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        default_credit_limit: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <Button onClick={saveSystemSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Supabase</p>
                      <p className="text-sm text-gray-500">Banco de dados e autenticação</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Conectado</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">API de CEP</p>
                      <p className="text-sm text-gray-500">Busca automática de endereços</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Ativo</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp Business</p>
                      <p className="text-sm text-gray-500">Envio de cobranças automáticas</p>
                    </div>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Desconectado</span>
                  </div>

                  <div className="space-y-4">
                    <Button onClick={generateWhatsAppQR} disabled={saving} variant="outline">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Gerar QR Code
                        </>
                      )}
                    </Button>

                    {whatsappQR && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Escaneie o QR Code com o WhatsApp Business:</p>
                        <img
                          src={whatsappQR || "/placeholder.svg"}
                          alt="WhatsApp QR Code"
                          className="mx-auto border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}