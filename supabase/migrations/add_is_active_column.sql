-- Run this query in your Supabase SQL Editor to add the is_active column:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Update existing profiles to have default value
UPDATE profiles SET is_active = false WHERE is_active IS NULL;
