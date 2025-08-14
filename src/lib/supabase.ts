
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjxlnpsubmxdxazdxbqv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeGxucHN1Ym14ZHhhemR4YnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA4MTU3NzUsImV4cCI6MjAyNjM5MTc3NX0.FmSuUMUelDSgEhpwjmylLgf-J6h76ImOBSPEJHGVgdQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export interface UserData {
  usuario: string;
  nomapellidos: string;
}
