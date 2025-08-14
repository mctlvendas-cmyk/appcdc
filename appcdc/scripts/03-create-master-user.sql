-- Script para criar usuário master inicial
-- OC - CDC Sistema de Crediário

-- Inserir usuário master no auth.users (Supabase Auth)
-- Nota: Este script deve ser executado no SQL Editor do Supabase
-- pois precisa inserir diretamente na tabela auth.users

-- Primeiro, vamos inserir na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@oc-cdc.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Agora inserir na tabela public.users usando o ID do usuário criado
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  store_name,
  phone,
  address,
  created_at,
  updated_at,
  active
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@oc-cdc.com'),
  'admin@oc-cdc.com',
  'Administrador Master',
  'master',
  'OC - CDC Matriz',
  '(11) 99999-9999',
  'Rua Principal, 123 - Centro',
  NOW(),
  NOW(),
  true
);

-- Verificar se o usuário foi criado corretamente
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.store_name
FROM public.users u
WHERE u.email = 'admin@oc-cdc.com';
