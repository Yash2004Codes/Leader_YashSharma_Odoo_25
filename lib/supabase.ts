import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window === 'undefined') {
    // Only warn in server-side during build/dev
    console.warn('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common operations
export async function dbGet(table: string, filters: Record<string, any> = {}, select = '*'): Promise<any> {
  let query = supabase.from(table).select(select).limit(1);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  const { data, error } = await query;
  if (error) {
    console.error(`Supabase error on ${table}:`, error);
    throw error;
  }
  return data && data.length > 0 ? data[0] : null;
}

export async function dbAll(table: string, filters: Record<string, any> = {}, select = '*', orderBy?: string) {
  let query = supabase.from(table).select(select);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  });
  
  if (orderBy) {
    const [column, direction] = orderBy.split(' ');
    query = query.order(column, { ascending: direction !== 'DESC' });
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function dbInsert(table: string, data: Record<string, any>) {
  // Generate UUID if id is not provided
  if (!data.id) {
    const { v4: uuidv4 } = await import('uuid');
    data.id = uuidv4();
  }
  
  const { data: result, error } = await supabase.from(table).insert(data).select().single();
  if (error) {
    console.error(`Supabase insert error on ${table}:`, error);
    throw error;
  }
  return result;
}

// Helper for inserting multiple records
export async function dbInsertMany(table: string, records: Record<string, any>[]) {
  const { v4: uuidv4 } = await import('uuid');
  const recordsWithIds = records.map(record => ({
    ...record,
    id: record.id || uuidv4()
  }));
  
  const { data, error } = await supabase.from(table).insert(recordsWithIds).select();
  if (error) throw error;
  return data || [];
}

export async function dbUpdate(table: string, filters: Record<string, any>, updates: Record<string, any>) {
  // Add updated_at timestamp for tables that have it
  const tablesWithUpdatedAt = ['users', 'warehouses', 'products', 'receipts', 'delivery_orders', 'internal_transfers', 'stock_adjustments'];
  const updatesWithTimestamp = tablesWithUpdatedAt.includes(table) 
    ? { ...updates, updated_at: new Date().toISOString() }
    : updates;
  
  let query = supabase.from(table).update(updatesWithTimestamp);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  const { data, error } = await query.select();
  if (error) {
    console.error(`Supabase update error on ${table}:`, error);
    throw error;
  }
  return data && data.length > 0 ? data[0] : null;
}

export async function dbDelete(table: string, filters: Record<string, any>) {
  let query = supabase.from(table).delete();
  
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Helper for LIKE queries with multiple fields
export async function dbSearch(table: string, searchFields: string[], searchTerm: string, filters: Record<string, any> = {}) {
  let query = supabase.from(table).select('*');
  
  // Add search conditions using OR
  if (searchTerm) {
    const searchPattern = `%${searchTerm}%`;
    const orConditions = searchFields.map(field => `${field}.ilike.${searchPattern}`).join(',');
    query = query.or(orConditions);
  }
  
  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function dbCount(table: string, filters: Record<string, any> = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  });
  
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

// Helper for complex joins and aggregations
export async function dbQueryRaw(query: string) {
  // For complex queries, we'll need to use Supabase's RPC functions
  // or break them down into multiple queries
  // This is a placeholder - implement based on specific needs
  const { data, error } = await supabase.rpc('execute_query', { query_text: query });
  if (error) throw error;
  return data;
}
