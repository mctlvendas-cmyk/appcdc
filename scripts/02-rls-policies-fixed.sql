-- Row Level Security Policies (Fixed - No Recursion)
-- Enable RLS on all tables

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Users policies (Fixed - No recursion)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create a function to check if user is master (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'master'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_master_user() TO authenticated;

-- Simplified policies using the function
CREATE POLICY "Master can view all users" ON public.users
  FOR SELECT USING (public.is_master_user());

-- Customers policies
CREATE POLICY "Users can view own customers" ON public.customers
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_master_user()
  );

CREATE POLICY "Users can insert own customers" ON public.customers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own customers" ON public.customers
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_master_user()
  );

-- Sales policies
CREATE POLICY "Users can view own sales" ON public.sales
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_master_user()
  );

CREATE POLICY "Users can insert own sales" ON public.sales
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sales" ON public.sales
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_master_user()
  );

-- Installments policies
CREATE POLICY "Users can view installments from own sales" ON public.installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE id = sale_id AND user_id = auth.uid()
    ) OR public.is_master_user()
  );

CREATE POLICY "Users can insert installments for own sales" ON public.installments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE id = sale_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update installments from own sales" ON public.installments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE id = sale_id AND user_id = auth.uid()
    ) OR public.is_master_user()
  );

-- Payments policies
CREATE POLICY "Users can view payments from own sales" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.is_master_user() OR
    EXISTS (
      SELECT 1 FROM public.installments i
      JOIN public.sales s ON i.sale_id = s.id
      WHERE i.id = installment_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Script ready to execute - fixes RLS recursion issues
