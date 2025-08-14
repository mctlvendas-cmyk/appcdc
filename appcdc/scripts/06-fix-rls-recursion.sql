-- Fix infinite recursion in RLS policies
-- Drop problematic policies and temporarily disable RLS on users table

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Master can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can view installments from own sales" ON public.installments;
DROP POLICY IF EXISTS "Users can insert installments for own sales" ON public.installments;
DROP POLICY IF EXISTS "Users can update installments from own sales" ON public.installments;
DROP POLICY IF EXISTS "Users can view payments from own sales" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;

-- Temporarily disable RLS on users table to prevent recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on other tables but with simpler policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Simple policies without recursion
-- Customers policies
CREATE POLICY "Allow all authenticated users to manage customers" ON public.customers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Sales policies  
CREATE POLICY "Allow all authenticated users to manage sales" ON public.sales
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Installments policies
CREATE POLICY "Allow all authenticated users to manage installments" ON public.installments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Payments policies
CREATE POLICY "Allow all authenticated users to manage payments" ON public.payments
  FOR ALL USING (auth.uid() IS NOT NULL);
