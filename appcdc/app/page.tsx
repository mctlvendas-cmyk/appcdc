import { redirect } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import LoginForm from "@/components/auth/login-form"

export default async function HomePage() {
  if (isSupabaseConfigured() && supabase) {
    // Check if user is already authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">OC - CDC</h1>
          <p className="text-gray-600">Sistema de Gestão de Crediário</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 OC - CDC. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
