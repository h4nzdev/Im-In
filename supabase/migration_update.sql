-- Realynk Enterprise Cloud Migration & RLS Policy Update
-- Run this block directly inside your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Ensure all new enterprise columns exist on profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'user123';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deadline_date VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deadline_title VARCHAR(255);

-- 2. Disable Row Level Security (RLS) on tables so frontend API keys can perform queries & seeds smoothly
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaves DISABLE ROW LEVEL SECURITY;

-- 3. Insert initial core positions
INSERT INTO positions (position_id, position_name, department)
VALUES
  ('POS-001', 'Executive Administrator', 'Management'),
  ('POS-002', 'Service Delivery Specialist', 'Service Delivery'),
  ('POS-003', 'Shared Services Analyst', 'Shared Services')
ON CONFLICT (position_id) DO UPDATE 
SET position_name = EXCLUDED.position_name, department = EXCLUDED.department;

-- 4. Insert Real Executive Admin Profile
INSERT INTO profiles (user_id, name, email, password, department, role, status, position_id)
VALUES
  ('ADM-001', 'Executive Admin', 'admin@realynk.com', 'admin123', 'Management', 'Admin', 'Active', 'POS-001')
ON CONFLICT (user_id) DO UPDATE
SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role;

-- 5. Insert Sample Real Employee Profiles
INSERT INTO profiles (user_id, name, email, password, department, assigned_account, role, status, position_id, deadline_date, deadline_title)
VALUES
  ('RLK-1001', 'Sarah Jenkins', 's.jenkins@realynk.com', 'password123', 'Service Delivery', 'FinTech Global Support', 'User', 'Active', 'POS-002', '2026-07-15', 'Complete Biometric Setup & Security Training'),
  ('RLK-1002', 'Marcus Vance', 'm.vance@realynk.com', 'password123', 'Shared Services', NULL, 'User', 'Active', 'POS-003', '2026-07-20', 'Submit Q3 Shared Services Roadmap'),
  ('RLK-1003', 'Elena Rostova', 'e.rostova@realynk.net', 'password123', 'Service Delivery', 'Healthcare Billing Operations', 'User', 'Active', 'POS-002', NULL, NULL)
ON CONFLICT (user_id) DO UPDATE
SET name = EXCLUDED.name, email = EXCLUDED.email, department = EXCLUDED.department, deadline_date = EXCLUDED.deadline_date, deadline_title = EXCLUDED.deadline_title;
