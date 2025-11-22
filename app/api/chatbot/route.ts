import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { dbGet, dbAll, supabase } from '@/lib/supabase';
import { getStockAvailability, checkStockAvailability } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const userMessage = message.toLowerCase().trim();
    let response = '';

    // Stock-related queries
    if (userMessage.includes('stock') || userMessage.includes('inventory') || userMessage.includes('quantity')) {
      response = await handleStockQuery(userMessage);
    }
    // Product queries
    else if (userMessage.includes('product') || userMessage.includes('item') || userMessage.includes('sku')) {
      response = await handleProductQuery(userMessage);
    }
    // Order queries (receipts, deliveries, transfers)
    else if (userMessage.includes('order') || userMessage.includes('receipt') || 
             userMessage.includes('delivery') || userMessage.includes('transfer')) {
      response = await handleOrderQuery(userMessage);
    }
    // Low stock / out of stock queries
    else if (userMessage.includes('low stock') || userMessage.includes('out of stock') || 
             userMessage.includes('reorder')) {
      response = await handleLowStockQuery(userMessage);
    }
    // Help queries
    else if (userMessage.includes('help') || userMessage.includes('how') || 
             userMessage.includes('what') || userMessage.includes('guide')) {
      response = getHelpResponse(userMessage);
    }
    // Dashboard/statistics queries
    else if (userMessage.includes('dashboard') || userMessage.includes('stat') || 
             userMessage.includes('summary') || userMessage.includes('overview')) {
      response = await handleDashboardQuery(userMessage);
    }
    // Default response
    else {
      response = getDefaultResponse(userMessage);
    }

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process query' 
    }, { status: 500 });
  }
}

async function handleStockQuery(query: string): Promise<string> {
  try {
    // Extract product name or SKU from query
    const productMatch = query.match(/(?:product|item|sku)\s+([a-z0-9\s]+)/i);
    const warehouseMatch = query.match(/(?:warehouse|location)\s+([a-z0-9\s]+)/i);
    const quantityMatch = query.match(/(\d+)/);

    if (productMatch) {
      const productSearch = productMatch[1].trim();
      
      // Search for product
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku')
        .or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%`)
        .limit(5);

      if (!products || products.length === 0) {
        return `I couldn't find a product matching "${productSearch}". Please check the product name or SKU.`;
      }

      if (products.length === 1) {
        const product = products[0];
        const { data: stockLevels } = await supabase
          .from('stock_levels')
          .select('quantity, reserved_quantity, warehouses(name)')
          .eq('product_id', product.id);

        if (!stockLevels || stockLevels.length === 0) {
          return `${product.name} (SKU: ${product.sku}) has no stock in any warehouse.`;
        }

        let stockInfo = `Stock information for ${product.name} (SKU: ${product.sku}):\n\n`;
        stockLevels.forEach((sl: any) => {
          const available = (sl.quantity || 0) - (sl.reserved_quantity || 0);
          stockInfo += `📍 ${sl.warehouses?.name || 'Unknown Warehouse'}: ${available} available (${sl.quantity || 0} total, ${sl.reserved_quantity || 0} reserved)\n`;
        });

        return stockInfo;
      } else {
        return `I found multiple products matching "${productSearch}". Please be more specific. Found: ${products.map((p: any) => p.name).join(', ')}`;
      }
    }

    // General stock overview
    const { data: stockLevels } = await supabase
      .from('stock_levels')
      .select('quantity, reserved_quantity, products(name, sku), warehouses(name)')
      .limit(20);

    if (!stockLevels || stockLevels.length === 0) {
      return 'No stock information available.';
    }

    let response = 'Current stock overview:\n\n';
    stockLevels.slice(0, 10).forEach((sl: any) => {
      const available = (sl.quantity || 0) - (sl.reserved_quantity || 0);
      response += `• ${sl.products?.name || 'Unknown'}: ${available} available in ${sl.warehouses?.name || 'Unknown'}\n`;
    });

    return response;
  } catch (error: any) {
    return `I encountered an error while checking stock: ${error.message}`;
  }
}

async function handleProductQuery(query: string): Promise<string> {
  try {
    const productMatch = query.match(/(?:product|item|sku)\s+([a-z0-9\s]+)/i);
    
    if (productMatch) {
      const productSearch = productMatch[1].trim();
      const { data: products } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%`)
        .limit(5);

      if (!products || products.length === 0) {
        return `I couldn't find a product matching "${productSearch}".`;
      }

      if (products.length === 1) {
        const product = products[0];
        return `Product: ${product.name}\nSKU: ${product.sku}\nCategory: ${product.product_categories?.name || 'N/A'}\nUnit: ${product.unit_of_measure}\nReorder Level: ${product.reorder_level || 0}`;
      } else {
        return `Found multiple products: ${products.map((p: any) => `${p.name} (${p.sku})`).join(', ')}`;
      }
    }

    // Count total products
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', 1);

    return `There are ${count || 0} active products in the system. You can search for a specific product by name or SKU.`;
  } catch (error: any) {
    return `Error retrieving product information: ${error.message}`;
  }
}

async function handleOrderQuery(query: string): Promise<string> {
  try {
    if (query.includes('receipt')) {
      const { count } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'waiting', 'ready']);

      return `There are ${count || 0} pending receipts. You can view them in the Receipts section.`;
    }

    if (query.includes('delivery')) {
      const { count } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'waiting', 'ready']);

      return `There are ${count || 0} pending delivery orders. You can view them in the Deliveries section.`;
    }

    if (query.includes('transfer')) {
      const { count } = await supabase
        .from('internal_transfers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'waiting', 'ready']);

      return `There are ${count || 0} pending transfers. You can view them in the Transfers section.`;
    }

    return 'I can help you with receipts, deliveries, or transfers. What would you like to know?';
  } catch (error: any) {
    return `Error retrieving order information: ${error.message}`;
  }
}

async function handleLowStockQuery(query: string): Promise<string> {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, reorder_level')
      .gt('reorder_level', 0)
      .eq('is_active', 1);

    if (!products || products.length === 0) {
      return 'No products have reorder levels set.';
    }

    const lowStockItems: any[] = [];

    for (const product of products) {
      const { data: stockLevels } = await supabase
        .from('stock_levels')
        .select('quantity, reserved_quantity, warehouses(name)')
        .eq('product_id', product.id);

      if (stockLevels) {
        const totalStock = stockLevels.reduce((sum: number, sl: any) => 
          sum + ((sl.quantity || 0) - (sl.reserved_quantity || 0)), 0);

        if (totalStock <= product.reorder_level) {
          lowStockItems.push({
            name: product.name,
            sku: product.sku,
            stock: totalStock,
            reorderLevel: product.reorder_level
          });
        }
      }
    }

    if (lowStockItems.length === 0) {
      return 'Great! All products are above their reorder levels.';
    }

    let response = `⚠️ Low Stock Alert: ${lowStockItems.length} product(s) need attention:\n\n`;
    lowStockItems.forEach(item => {
      response += `• ${item.name} (${item.sku}): ${item.stock} units (Reorder level: ${item.reorderLevel})\n`;
    });

    return response;
  } catch (error: any) {
    return `Error checking low stock: ${error.message}`;
  }
}

async function handleDashboardQuery(query: string): Promise<string> {
  try {
    const [productsResult, receiptsResult, deliveriesResult, transfersResult] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', 1),
      supabase.from('receipts').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready']),
      supabase.from('delivery_orders').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready']),
      supabase.from('internal_transfers').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready'])
    ]);

    // Count low stock items
    const { data: products } = await supabase
      .from('products')
      .select('id, reorder_level')
      .gt('reorder_level', 0)
      .eq('is_active', 1);

    let lowStockCount = 0;
    if (products) {
      for (const product of products) {
        const { data: stockLevels } = await supabase
          .from('stock_levels')
          .select('quantity, reserved_quantity')
          .eq('product_id', product.id);

        if (stockLevels) {
          const totalStock = stockLevels.reduce((sum: number, sl: any) => 
            sum + ((sl.quantity || 0) - (sl.reserved_quantity || 0)), 0);
          if (totalStock <= product.reorder_level) {
            lowStockCount++;
          }
        }
      }
    }

    return `📊 Dashboard Summary:\n\n` +
           `• Total Products: ${productsResult.count || 0}\n` +
           `• Low Stock Items: ${lowStockCount}\n` +
           `• Pending Receipts: ${receiptsResult.count || 0}\n` +
           `• Pending Deliveries: ${deliveriesResult.count || 0}\n` +
           `• Pending Transfers: ${transfersResult.count || 0}\n\n` +
           `Ask me about specific products, stock levels, or orders for more details!`;
  } catch (error: any) {
    return `Error retrieving dashboard information: ${error.message}`;
  }
}

function getHelpResponse(query: string): string {
  return `🤖 I'm your inventory management assistant! I can help you with:\n\n` +
         `📦 **Stock Information**: Ask about stock levels, availability, or inventory\n` +
         `🔍 **Product Search**: Find products by name or SKU\n` +
         `📋 **Orders**: Check receipts, deliveries, or transfers\n` +
         `⚠️ **Alerts**: Get low stock or out of stock notifications\n` +
         `📊 **Dashboard**: View summary statistics\n\n` +
         `**Example queries:**\n` +
         `• "What's the stock of product X?"\n` +
         `• "Show me low stock items"\n` +
         `• "How many pending deliveries?"\n` +
         `• "Find product with SKU ABC123"\n\n` +
         `Just ask me anything about your inventory!`;
}

function getDefaultResponse(query: string): string {
  return `I'm not sure how to help with that. I can assist you with:\n\n` +
         `• Stock levels and inventory\n` +
         `• Product information\n` +
         `• Orders (receipts, deliveries, transfers)\n` +
         `• Low stock alerts\n` +
         `• General help\n\n` +
         `Try asking something like "What's the stock of [product name]?" or "Show me low stock items".`;
}

