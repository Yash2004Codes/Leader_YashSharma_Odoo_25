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

export interface StockAvailabilityResult {
  isAvailable: boolean;
  availableQuantity: number;
  totalQuantity: number;
  reservedQuantity: number;
  requestedQuantity: number;
  shortfall: number;
  productId: string;
  warehouseId: string;
  productName?: string;
  productSku?: string;
  warehouseName?: string;
}

export interface StockCheckResult {
  allAvailable: boolean;
  unavailableItems: StockAvailabilityResult[];
  availableItems: StockAvailabilityResult[];
}

/**
 * Get stock availability for a single product in a warehouse
 */
export async function getStockAvailability(
  productId: string,
  warehouseId: string,
  requestedQuantity: number = 0
): Promise<StockAvailabilityResult> {
  const stock = await dbGet('stock_levels', { 
    product_id: productId, 
    warehouse_id: warehouseId 
  }) as any;

  const totalQuantity = stock?.quantity || 0;
  const reservedQuantity = stock?.reserved_quantity || 0;
  const availableQuantity = totalQuantity - reservedQuantity;
  const shortfall = Math.max(0, requestedQuantity - availableQuantity);
  const isAvailable = availableQuantity >= requestedQuantity;

  // Get product and warehouse details for better error messages
  const [product, warehouse] = await Promise.all([
    dbGet('products', { id: productId }),
    dbGet('warehouses', { id: warehouseId })
  ]);

  return {
    isAvailable,
    availableQuantity,
    totalQuantity,
    reservedQuantity,
    requestedQuantity,
    shortfall,
    productId,
    warehouseId,
    productName: (product as any)?.name,
    productSku: (product as any)?.sku,
    warehouseName: (warehouse as any)?.name
  };
}

/**
 * Check stock availability for multiple items
 */
export async function checkStockAvailability(
  items: Array<{ product_id: string; quantity: number }>,
  warehouseId: string
): Promise<StockCheckResult> {
  const unavailableItems: StockAvailabilityResult[] = [];
  const availableItems: StockAvailabilityResult[] = [];

  for (const item of items) {
    const availability = await getStockAvailability(
      item.product_id,
      warehouseId,
      item.quantity
    );

    if (availability.isAvailable) {
      availableItems.push(availability);
    } else {
      unavailableItems.push(availability);
    }
  }

  return {
    allAvailable: unavailableItems.length === 0,
    unavailableItems,
    availableItems
  };
}

/**
 * Validate stock availability and throw detailed error if unavailable
 */
export async function validateStockAvailability(
  items: Array<{ product_id: string; quantity: number }>,
  warehouseId: string
): Promise<void> {
  const checkResult = await checkStockAvailability(items, warehouseId);

  if (!checkResult.allAvailable) {
    const errors = checkResult.unavailableItems.map(item => {
      return `${item.productName || item.productSku || item.productId}: Available ${item.availableQuantity}, Requested ${item.requestedQuantity}, Shortfall ${item.shortfall}`;
    });

    throw new Error(`Insufficient stock:\n${errors.join('\n')}`);
  }
}

/**
 * Get available stock quantity (total - reserved)
 */
export async function getAvailableStock(
  productId: string,
  warehouseId: string
): Promise<number> {
  const stock = await dbGet('stock_levels', { 
    product_id: productId, 
    warehouse_id: warehouseId 
  }) as any;

  const totalQuantity = stock?.quantity || 0;
  const reservedQuantity = stock?.reserved_quantity || 0;
  return totalQuantity - reservedQuantity;
}

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

  // Prevent negative stock (unless it's an adjustment)
  if (quantityAfter < 0 && transactionType !== 'adjustment') {
    throw new Error(`Stock cannot go negative. Current: ${quantityBefore}, Change: ${quantityChange}`);
  }

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
