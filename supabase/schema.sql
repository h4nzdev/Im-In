-- Realynk Enterprise Attendance Platform - Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Employee Records)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. RLK-1001, USR-001
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL, -- 'Shared Services' or 'Service Delivery'
  assigned_account VARCHAR(150), -- e.g. 'FinTech Global Support' if Service Delivery
  role VARCHAR(50) DEFAULT 'User', -- 'Admin' or 'User'
  status VARCHAR(50) DEFAULT 'Pending', -- 'Active', 'Pending', 'Inactive'
  position_id VARCHAR(50) NOT NULL,
  password VARCHAR(255) DEFAULT 'user123',
  deadline_date VARCHAR(50),
  deadline_title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Positions Table
CREATE TABLE IF NOT EXISTS public.positions (
  position_id VARCHAR(50) PRIMARY KEY,
  position_name VARCHAR(255) NOT NULL,
  department VARCHAR(100)
);

-- 3. Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  log_id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'IN' or 'OUT'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  device_info TEXT,
  status VARCHAR(50) DEFAULT 'ON TIME', -- 'ON TIME', 'LATE', 'UNDERTIME'
  late_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  leave_id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  leave_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated staff
CREATE POLICY "Allow read access for staff" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow read access for positions" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Allow read access for attendance" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Allow read access for leaves" ON public.leaves FOR SELECT USING (true);

-- Allow insertion for new employee registration and biometric punches
CREATE POLICY "Allow staff signup" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow biometric punch" ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow leave request" ON public.leaves FOR INSERT WITH CHECK (true);
