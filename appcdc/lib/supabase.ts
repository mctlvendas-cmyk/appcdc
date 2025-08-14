import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lebgwxbvvljdshtzvzwh.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlYmd3eGJ2dmxqZHNodHp2endoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzg2NDQsImV4cCI6MjA3MDYxNDY0NH0.vMRXRXrh0Ct2F-TVKkd-YeP4Em0OsWPWd-FR2AWWZ70"

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return true
}

// Types for our database
export type UserRole = "master" | "loja" | "vendedor"
export type PaymentStatus = "pendente" | "pago" | "atrasado" | "cancelado"
export type InstallmentStatus = "pendente" | "pago" | "atrasado" | "cancelado"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  store_name?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
  active: boolean
}

export interface Customer {
  id: string
  user_id: string
  full_name: string
  cpf: string
  rg?: string
  birth_date?: string
  phone: string
  email?: string
  address: string
  neighborhood?: string
  city: string
  state: string
  zip_code?: string
  occupation?: string
  monthly_income?: number
  reference_name?: string
  reference_phone?: string
  notes?: string
  credit_limit: number
  current_debt: number
  created_at: string
  updated_at: string
  active: boolean
}

export interface Sale {
  id: string
  user_id: string
  customer_id: string
  sale_number: string
  total_amount: number
  down_payment: number
  financed_amount: number
  installments_count: number
  installment_value: number
  interest_rate: number
  sale_date: string
  first_due_date: string
  description?: string
  notes?: string
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface Installment {
  id: string
  sale_id: string
  installment_number: number
  due_date: string
  amount: number
  paid_amount: number
  payment_date?: string
  late_fee: number
  discount: number
  status: InstallmentStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  installment_id: string
  user_id: string
  amount: number
  payment_date: string
  payment_method: string
  notes?: string
  created_at: string
}
