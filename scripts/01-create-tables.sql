-- OC - CDC Database Schema
-- Credit Management System Tables

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create custom types
CREATE TYPE user_role AS ENUM ('master', 'loja', 'vendedor');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE installment_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'loja',
  store_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Customers table
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  birth_date DATE,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  occupation TEXT,
  monthly_income DECIMAL(10,2),
  reference_name TEXT,
  reference_phone TEXT,
  notes TEXT,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  current_debt DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Sales table
CREATE TABLE public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  sale_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) DEFAULT 0,
  financed_amount DECIMAL(10,2) NOT NULL,
  installments_count INTEGER NOT NULL,
  installment_value DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  first_due_date DATE NOT NULL,
  description TEXT,
  notes TEXT,
  status payment_status DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Installments table
CREATE TABLE public.installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  late_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  status installment_status DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sale_id, installment_number)
);

-- Payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_id UUID REFERENCES public.installments(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'dinheiro',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_cpf ON public.customers(cpf);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_installments_sale_id ON public.installments(sale_id);
CREATE INDEX idx_installments_due_date ON public.installments(due_date);
CREATE INDEX idx_installments_status ON public.installments(status);
CREATE INDEX idx_payments_installment_id ON public.payments(installment_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);

-- Script ready to execute - creates all tables and indexes
