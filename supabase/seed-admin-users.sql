-- IMPORTANT: This SQL script is meant to be run in the Supabase SQL Editor
-- It will create the admin users with the specified emails
-- You'll need to set a password for each user or use password reset

-- NOTE: This is just an example. In a real production environment,
-- you should create users through the Supabase Auth UI or API
-- and set secure passwords.

-- Create admin user: KamilDaaboul@outlook.com
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'KamilDaaboul@outlook.com',
  -- This is a placeholder. You should set a real password through the Supabase UI
  -- or use a password reset flow
  crypt('REPLACE_WITH_SECURE_PASSWORD', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email"}',
  '{"role":"admin"}',
  FALSE,
  'authenticated'
);

-- Create admin user: CamilioDaaboul@oulook.com
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'CamilioDaaboul@oulook.com',
  crypt('REPLACE_WITH_SECURE_PASSWORD', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email"}',
  '{"role":"admin"}',
  FALSE,
  'authenticated'
);

-- Create admin user: GeorgesElias@outlook.com
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'GeorgesElias@outlook.com',
  crypt('REPLACE_WITH_SECURE_PASSWORD', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email"}',
  '{"role":"admin"}',
  FALSE,
  'authenticated'
);

-- Create admin user: ElieMina@outlook.com
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'ElieMina@outlook.com',
  crypt('REPLACE_WITH_SECURE_PASSWORD', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email"}',
  '{"role":"admin"}',
  FALSE,
  'authenticated'
);

-- IMPORTANT: After running this script, you should:
-- 1. Send password reset emails to these users via the Supabase Auth UI
-- 2. Or set passwords directly if this is just for development 