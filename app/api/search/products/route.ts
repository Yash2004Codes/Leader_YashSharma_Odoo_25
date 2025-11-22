import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export interface SearchResult {
  id: string;
  name: string;
  sku: string;
  category_name?: string;
  available_stock: number;
  total_stock: number;
  warehouse_name?: string;
  match_type: 'exact_sku' | 'partial_sku' | 'exact_name' | 'partial_name' | 'fuzzy';
  match_score: number;
}

/**
 * Intelligent search with fuzzy matching, autocomplete, and SKU prioritization
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const warehouseId = searchParams.get('warehouse_id');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [], suggestions: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Get all products with stock information
    let productsQuery = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        is_active,
        product_categories(name),
        stock_levels(
          warehouse_id,
          quantity,
          reserved_quantity,
          warehouses(name, code)
        )
      `)
      .eq('is_active', 1)
      .limit(100); // Get more to filter and rank

    const { data: products, error } = await productsQuery;

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ results: [], suggestions: [] });
    }

    // Intelligent matching and scoring
    const scoredResults: (SearchResult & { score: number })[] = [];

    for (const product of products) {
      const productSku = (product.sku || '').toLowerCase();
      const productName = (product.name || '').toLowerCase();
      const categoryName = (product.product_categories?.name || '').toLowerCase();

      let matchType: SearchResult['match_type'] = 'fuzzy';
      let matchScore = 0;

      // Exact SKU match (highest priority)
      if (productSku === searchTerm) {
        matchType = 'exact_sku';
        matchScore = 1000;
      }
      // SKU starts with search term
      else if (productSku.startsWith(searchTerm)) {
        matchType = 'partial_sku';
        matchScore = 800 + (searchTerm.length / productSku.length) * 100;
      }
      // SKU contains search term
      else if (productSku.includes(searchTerm)) {
        matchType = 'partial_sku';
        matchScore = 600 + (searchTerm.length / productSku.length) * 100;
      }
      // Exact name match
      else if (productName === searchTerm) {
        matchType = 'exact_name';
        matchScore = 500;
      }
      // Name starts with search term
      else if (productName.startsWith(searchTerm)) {
        matchType = 'partial_name';
        matchScore = 400 + (searchTerm.length / productName.length) * 50;
      }
      // Name contains search term
      else if (productName.includes(searchTerm)) {
        matchType = 'partial_name';
        matchScore = 300 + (searchTerm.length / productName.length) * 50;
      }
      // Category match
      else if (categoryName.includes(searchTerm)) {
        matchScore = 100;
      }
      // Fuzzy match (word boundaries)
      else {
        const nameWords = productName.split(/\s+/);
        const skuWords = productSku.split(/[-_\s]+/);
        const searchWords = searchTerm.split(/\s+/);

        for (const searchWord of searchWords) {
          if (nameWords.some(word => word.startsWith(searchWord))) {
            matchScore += 50;
          }
          if (skuWords.some(word => word.startsWith(searchWord))) {
            matchScore += 30;
          }
        }
      }

      // Only include if there's a match
      if (matchScore > 0) {
        // Calculate stock information
        const stockLevels = product.stock_levels || [];
        let totalStock = 0;
        let availableStock = 0;
        let warehouseName = '';

        // Filter by warehouse if specified
        let relevantStock = stockLevels;
        if (warehouseId) {
          relevantStock = stockLevels.filter((sl: any) => sl.warehouse_id === warehouseId);
        }

        if (relevantStock.length > 0) {
          totalStock = relevantStock.reduce((sum: number, sl: any) => sum + (sl.quantity || 0), 0);
          availableStock = relevantStock.reduce(
            (sum: number, sl: any) => sum + ((sl.quantity || 0) - (sl.reserved_quantity || 0)),
            0
          );
          warehouseName = relevantStock[0]?.warehouses?.name || '';
        } else if (stockLevels.length > 0) {
          // If warehouse filter but no match, still calculate totals
          totalStock = stockLevels.reduce((sum: number, sl: any) => sum + (sl.quantity || 0), 0);
          availableStock = stockLevels.reduce(
            (sum: number, sl: any) => sum + ((sl.quantity || 0) - (sl.reserved_quantity || 0)),
            0
          );
        }

        scoredResults.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category_name: product.product_categories?.name,
          available_stock: availableStock,
          total_stock: totalStock,
          warehouse_name: warehouseName,
          match_type: matchType,
          match_score: matchScore,
          score: matchScore, // For sorting
        });
      }
    }

    // Sort by score (highest first), then by name
    scoredResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.name.localeCompare(b.name);
    });

    // Take top results
    const results = scoredResults.slice(0, limit).map(({ score, ...rest }) => rest);

    // Generate suggestions (top 5 unique SKUs/names)
    const suggestions = Array.from(
      new Set(
        scoredResults
          .slice(0, 20)
          .flatMap(r => [r.sku, r.name])
          .filter(Boolean)
      )
    ).slice(0, 5);

    return NextResponse.json({
      results,
      suggestions,
      total: scoredResults.length,
    });
  } catch (error: any) {
    console.error('Search products error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

