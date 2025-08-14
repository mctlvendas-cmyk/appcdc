"use client"

import { useState } from "react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("empresa")

  const tabs = [
    { id: "empresa", name: "Empresa", icon: "🏢" },
    { id: "notificacoes", name: "Notificações", icon: "🔔" },
    { id: "seguranca", name: "Segurança", icon: "🔒" },
    { id: "sistema", name: "Sistema", icon: "⚙️" },
    { id: "integracoes", name: "Integrações", icon: "🔗" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow border">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "empresa" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Informações da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                  <input
                    type="text"
                    defaultValue="OC - CDC Matriz"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                  <input
                    type="text"
                    defaultValue="12.345.678/0001-90"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    defaultValue="(11) 3456-7890"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input
                    type="email"
                    defaultValue="contato@oc-cdc.com"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Salvar Alterações
              </button>
            </div>
          )}

          {activeTab === "notificacoes" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações de Notificações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificações de Vencimento</p>
                    <p className="text-sm text-gray-500">Receber alertas sobre parcelas vencendo</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificações de Pagamento</p>
                    <p className="text-sm text-gray-500">Receber confirmações de pagamentos</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Relatórios Automáticos</p>
                    <p className="text-sm text-gray-500">Enviar relatórios mensais por e-mail</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "seguranca" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alterar Senha</label>
                  <input
                    type="password"
                    placeholder="Nova senha"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                  <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 mr-2" />
                  <label className="text-sm text-gray-700">Exigir autenticação de dois fatores</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sistema" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações do Sistema</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taxa de Juros Padrão (%)</label>
                  <input
                    type="number"
                    defaultValue="2.5"
                    step="0.1"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dias para Vencimento Padrão</label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limite de Crédito Padrão</label>
                  <input
                    type="number"
                    defaultValue="5000"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "integracoes" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Integrações</h3>
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
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Configurar</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp Business</p>
                      <p className="text-sm text-gray-500">Envio de cobranças automáticas</p>
                    </div>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Desconectado</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
