-- Script para criar dados de demonstração
-- Cliente demo e venda exemplo

-- Inserir cliente demo
INSERT INTO public.customers (
  id,
  user_id,
  full_name,
  cpf,
  phone,
  address,
  city,
  state,
  credit_limit,
  current_debt,
  created_at,
  updated_at,
  active
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = 'admin@oc-cdc.com'),
  'João Silva Santos',
  '123.456.789-00',
  '(11) 98765-4321',
  'Rua das Flores, 456 - Jardim Primavera',
  'São Paulo',
  'SP',
  5000.00,
  0.00,
  NOW(),
  NOW(),
  true
);

-- Inserir venda demo com parcelas
WITH new_sale AS (
  INSERT INTO public.sales (
    id,
    user_id,
    customer_id,
    sale_number,
    total_amount,
    down_payment,
    financed_amount,
    installments_count,
    installment_value,
    interest_rate,
    sale_date,
    first_due_date,
    description,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM public.users WHERE email = 'admin@oc-cdc.com'),
    (SELECT id FROM public.customers WHERE cpf = '123.456.789-00'),
    'VND-001',
    1200.00,
    200.00,
    1000.00,
    10,
    100.00,
    2.5,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'Móveis para sala - Sofá e mesa de centro',
    'pendente',
    NOW(),
    NOW()
  ) RETURNING id, first_due_date
)
-- Inserir parcelas da venda
INSERT INTO public.installments (
  sale_id,
  installment_number,
  due_date,
  amount,
  status,
  created_at,
  updated_at
)
SELECT 
  new_sale.id,
  generate_series(1, 10) as installment_number,
  new_sale.first_due_date + (generate_series(1, 10) - 1) * INTERVAL '30 days' as due_date,
  100.00 as amount,
  'pendente' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM new_sale;

-- Verificar dados criados
SELECT 'Usuários criados:' as info;
SELECT email, full_name, role FROM public.users;

SELECT 'Clientes criados:' as info;
SELECT full_name, cpf, phone FROM public.customers;

SELECT 'Vendas criadas:' as info;
SELECT sale_number, total_amount, installments_count FROM public.sales;

SELECT 'Parcelas criadas:' as info;
SELECT COUNT(*) as total_parcelas FROM public.installments;
