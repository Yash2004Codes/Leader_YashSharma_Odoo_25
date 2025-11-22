// Re-export Supabase helpers for backward compatibility
export { supabase, dbGet, dbAll, dbInsert, dbUpdate, dbDelete } from './supabase';
import { supabase } from './supabase';

// Legacy function names for compatibility
export async function getDatabase() {
  return supabase;
}