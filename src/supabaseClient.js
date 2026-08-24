import { createClient } from '@supabase/supabase-js';

// The URL and "anon" key below are safe to be public — they identify which
// Supabase project to talk to, not a secret. Real access control is enforced
// server-side by Row Level Security policies on each table, not by keeping
// this key hidden.
const SUPABASE_URL = 'https://cxhepcvzzsneikysdkmh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aGVwY3Z6enNuZWlreXNka21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTE2NjMsImV4cCI6MjEwMzEyNzY2M30.gO9Rbnt_CAdtJJRKG9LEkI0tAZqNDO7Gqh8riI2YMl0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
