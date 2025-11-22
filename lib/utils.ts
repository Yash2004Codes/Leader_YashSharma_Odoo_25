import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return uuidv4();
}

// Keep for backward compatibility - now async
export async function generateIdAsync(): Promise<string> {
  return uuidv4();
}

export function generateReceiptNumber(): string {
  return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function generateDeliveryOrderNumber(): string {
  return `DO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function generateTransferNumber(): string {
  return `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function generateAdjustmentNumber(): string {
  return `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

import { dbGet, dbInsert, dbUpdate, dbAll, supabase } from './supabase';

export async function updateStockLevel(
  productId: string,
  warehouseId: string,
  quantityChange: number,
  transactionType: string,
  transactionId: string,
  referenceNumber: string,
  userId: string,
  notes?: string
) {
  // Get current stock
  const currentStock = await dbGet('stock_levels', { product_id: productId, warehouse_id: warehouseId });
  
  const quantityBefore = currentStock?.quantity || 0;
  const quantityAfter = quantityBefore + quantityChange;

  // Update or insert stock level
  if (currentStock && currentStock.id) {
    // Direct update with new quantity
    await dbUpdate(
      'stock_levels',
      { id: currentStock.id },
      { 
        quantity: quantityAfter
      }
    );
  } else {
    await dbInsert('stock_levels', {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: quantityAfter,
      reserved_quantity: 0
    });
  }

  // Log to ledger
  await dbInsert('stock_ledger', {
    product_id: productId,
    warehouse_id: warehouseId,
    transaction_type: transactionType,
    transaction_id: transactionId,
    quantity_change: quantityChange,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    reference_number: referenceNumber,
    notes: notes || null,
    created_by: userId
  });
}
