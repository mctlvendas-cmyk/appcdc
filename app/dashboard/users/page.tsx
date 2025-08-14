"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, UserCheck, UserX, Shield, Loader2, Edit, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { User, UserRole } from "@/lib/supabase"

interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  masterUsers: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    masterUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "vendedor" as UserRole,
    store_name: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Get current user and check if master
      const user = await getCurrentUser()
      if (!user) {
        setError("Usuário não encontrado.")
        return
      }

      if (user.role !== "master") {
        setError("Acesso negado. Apenas administradores master podem gerenciar usuários.")
        return
      }

      setCurrentUser(user)

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error loading users:", usersError)
        setError("Erro ao carregar usuários.")
        return
      }

      setUsers(usersData || [])
      calculateStats(usersData || [])
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Erro ao carregar usuários.")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (usersData: User[]) => {
    const totalUsers = usersData.length
    const activeUsers = usersData.filter((user) => user.active).length
    const inactiveUsers = usersData.filter((user) => !user.active).length
    const masterUsers = usersData.filter((user) => user.role === "master").length

    setStats({
      totalUsers,
      activeUsers,
      inactiveUsers,
      masterUsers,
    })
  }

  const handleCreateUser = async () => {
    if (!currentUser) return

    setActionLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate required fields
      if (!userForm.full_name || !userForm.email || !userForm.password) {
        setError("Por favor, preencha todos os campos obrigatórios.")
        return
      }

      // Check if email already exists
      const { data: existingUser } = await supabase.from("users").select("id").eq("email", userForm.email).single()

      if (existingUser) {
        setError("Já existe um usuário com este email.")
        return
      }

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
      })

      if (authError) {
        console.error("Error creating auth user:", authError)
        setError("Erro ao criar usuário de autenticação.")
        return
      }

      if (!authData.user) {
        setError("Erro ao criar usuário.")
        return
      }

      // Create user record
      const userData = {
        id: authData.user.id,
        email: userForm.email,
        full_name: userForm.full_name.trim(),
        role: userForm.role,
        store_name: userForm.store_name.trim() || null,
        phone: userForm.phone.trim() || null,
        address: userForm.address.trim() || null,
        active: true,
      }

      const { error: insertError } = await supabase.from("users").insert([userData])

      if (insertError) {
        console.error("Error inserting user:", insertError)
        setError("Erro ao criar usuário.")
        return
      }

      // Reset form and reload users
      setUserForm({
        full_name: "",
        email: "",
        password: "",
        role: "vendedor",
        store_name: "",
        phone: "",
        address: "",
      })
      setIsCreateDialogOpen(false)
      setSuccess("Usuário criado com sucesso!")
      loadUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      setError("Erro ao criar usuário.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate required fields
      if (!userForm.full_name || !userForm.email) {
        setError("Por favor, preencha todos os campos obrigatórios.")
        return
      }

      // Check if email already exists (excluding current user)
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", userForm.email)
        .neq("id", selectedUser.id)
        .single()

      if (existingUser) {
        setError("Já existe um usuário com este email.")
        return
      }

      // Update user record
      const userData = {
        email: userForm.email,
        full_name: userForm.full_name.trim(),
        role: userForm.role,
        store_name: userForm.store_name.trim() || null,
        phone: userForm.phone.trim() || null,
        address: userForm.address.trim() || null,
      }

      const { error: updateError } = await supabase.from("users").update(userData).eq("id", selectedUser.id)

      if (updateError) {
        console.error("Error updating user:", updateError)
        setError("Erro ao atualizar usuário.")
        return
      }

      // Reset form and reload users
      setSelectedUser(null)
      setIsEditDialogOpen(false)
      setSuccess("Usuário atualizado com sucesso!")
      loadUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Erro ao atualizar usuário.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    if (!currentUser) return

    setActionLoading(true)
    setError("")
    setSuccess("")

    try {
      const newStatus = !user.active

      const { error } = await supabase.from("users").update({ active: newStatus }).eq("id", user.id)

      if (error) {
        console.error("Error updating user status:", error)
        setError("Erro ao atualizar status do usuário.")
        return
      }

      setSuccess(`Usuário ${newStatus ? "ativado" : "desativado"} com sucesso!`)
      loadUsers()
    } catch (error) {
      console.error("Error toggling user status:", error)
      setError("Erro ao atualizar status do usuário.")
    } finally {
      setActionLoading(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      store_name: user.store_name || "",
      phone: user.phone || "",
      address: user.address || "",
    })
    setIsEditDialogOpen(true)
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "master":
        return "bg-purple-100 text-purple-800"
      case "loja":
        return "bg-blue-100 text-blue-800"
      case "vendedor":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case "master":
        return "Master"
      case "loja":
        return "Loja"
      case "vendedor":
        return "Vendedor"
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!currentUser || currentUser.role !== "master") {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Acesso negado. Apenas administradores master podem gerenciar usuários.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários e permissões do sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
        </Dialog>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Total Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <UserX className="h-4 w-4 mr-2 text-red-600" />
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-purple-600" />
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.masterUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.store_name && <div className="text-xs text-gray-400">{user.store_name}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRoleColor(user.role)}>{getRoleText(user.role)}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.active ? "default" : "destructive"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          disabled={actionLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={actionLoading || user.id === currentUser.id}
                        >
                          {user.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={userForm.full_name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Senha do usuário"
              />
            </div>

            <div>
              <Label htmlFor="role">Função</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: UserRole) => setUserForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="loja">Loja</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="store_name">Nome da Loja</Label>
              <Input
                id="store_name"
                value={userForm.store_name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, store_name: e.target.value }))}
                placeholder="Nome da loja (opcional)"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={userForm.phone}
                onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_full_name">Nome Completo *</Label>
              <Input
                id="edit_full_name"
                value={userForm.full_name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div>
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="edit_role">Função</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: UserRole) => setUserForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="loja">Loja</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_store_name">Nome da Loja</Label>
              <Input
                id="edit_store_name"
                value={userForm.store_name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, store_name: e.target.value }))}
                placeholder="Nome da loja (opcional)"
              />
            </div>

            <div>
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                value={userForm.phone}
                onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Usuário"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
