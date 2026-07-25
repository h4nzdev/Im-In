-- ═══════════════════════════════════════════════════════════════════
-- Multi-Geofence Support + Admin Notifications
-- Run this in Supabase SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ensure the geofences table supports multiple rows (it already does by
--    design, but make sure the PK is a text id, not just 'global').
CREATE TABLE IF NOT EXISTS public.geofences (
  id          TEXT PRIMARY KEY,
  address_name TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  radius       INTEGER NOT NULL DEFAULT 300,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE public.geofences DISABLE ROW LEVEL SECURITY;

-- 2. Admin Notifications table (used by db.addNotification / deleteNotification)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          TEXT PRIMARY KEY,
  message     TEXT,
  type        TEXT DEFAULT 'info',
  timestamp   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE public.admin_notifications DISABLE ROW LEVEL SECURITY;
