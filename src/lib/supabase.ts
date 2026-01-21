import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uctwmdbmbaapbawpaywq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdHdtZGJtYmFhcGJhd3BheXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTk5NDgsImV4cCI6MjA4NDI5NTk0OH0.tuON4XP1bIBSU3kEW29gFdPAJUr1-JDGB5hsJwF5DAE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
