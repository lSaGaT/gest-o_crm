import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tpfybaoelaebkhbkkocl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZnliYW9lbGFlYmtoYmtrb2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDQyNDEsImV4cCI6MjA5MDI4MDI0MX0.RkrKV_DNn-bUGc1L99eOsA_rm8n7CDKAqqNV0-IsvKw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
