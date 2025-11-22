# Intelligent Search & Filter Guide

## Overview
The Intelligent Search system provides advanced SKU and product search capabilities with autocomplete, fuzzy matching, and smart ranking. It helps users quickly find products by SKU, name, or category with minimal typing.

## Features

### 🔍 Search Capabilities

1. **Exact SKU Match** (Highest Priority)
   - Finds products with exact SKU match
   - Example: Search "ABC123" finds product with SKU "ABC123"
   - Score: 1000

2. **Partial SKU Match**
   - Finds products where SKU starts with or contains the search term
   - Example: Search "ABC" finds "ABC123", "ABC-456"
   - Score: 600-900

3. **Exact Name Match**
   - Finds products with exact name match
   - Example: Search "Widget A" finds product named "Widget A"
   - Score: 500

4. **Partial Name Match**
   - Finds products where name starts with or contains the search term
   - Example: Search "Widget" finds "Widget A", "Widget B"
   - Score: 300-450

5. **Fuzzy Matching**
   - Finds products using word-based matching
   - Works with partial words and typos
   - Example: Search "wid" finds "Widget"
   - Score: 30-100

6. **Category Matching**
   - Finds products by category name
   - Example: Search "Electronics" finds all products in Electronics category
   - Score: 100

### ✨ Smart Features

- **Autocomplete**: Shows suggestions as you type
- **Debounced Search**: Waits for user to stop typing (300ms default)
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Stock Information**: Shows available stock in results
- **Match Type Badges**: Visual indicators of match quality
- **Warehouse Filtering**: Respects warehouse filter context
- **Real-time Results**: Updates as you type

## Usage

### Basic Search

1. **Start Typing**: Enter SKU or product name in the search box
2. **View Results**: Dropdown shows matching products with details
3. **Select Product**: Click on a result or use keyboard navigation
4. **Filter Results**: Results are automatically filtered by warehouse if selected

### Keyboard Shortcuts

- **Arrow Down**: Navigate to next result
- **Arrow Up**: Navigate to previous result
- **Enter**: Select highlighted result
- **Escape**: Close dropdown
- **Tab**: Move to next field (closes dropdown)

### Search Examples

#### SKU Search
```
Input: "ABC"
Results:
  - ABC123 (Exact SKU Match) - Widget A
  - ABC-456 (SKU Match) - Widget B
  - ABC-XYZ (SKU Match) - Widget C
```

#### Product Name Search
```
Input: "Widget"
Results:
  - Widget A (Name Match) - SKU: WID-001
  - Widget B (Name Match) - SKU: WID-002
  - Widget Pro (Name Match) - SKU: WID-PRO
```

#### Partial Search
```
Input: "wid"
Results:
  - Widget A (Fuzzy Match) - SKU: WID-001
  - Widget B (Fuzzy Match) - SKU: WID-002
```

## Component: SmartSearch

### Props

```typescript
interface SmartSearchProps {
  placeholder?: string;           // Placeholder text
  onSelect?: (result: SearchResult) => void;  // Callback when result selected
  onSearch?: (query: string) => void;         // Callback when search performed
  warehouseId?: string;           // Filter by warehouse
  className?: string;             // Additional CSS classes
  debounceMs?: number;            // Debounce delay (default: 300ms)
  showSuggestions?: boolean;      // Show suggestions (default: true)
  minChars?: number;              // Minimum characters to search (default: 1)
}
```

### Usage Example

```typescript
import { SmartSearch } from '@/components/ui/SmartSearch';
import { SearchResult } from '@/app/api/search/products/route';

<SmartSearch
  placeholder="Search by SKU or product name..."
  warehouseId={selectedWarehouse}
  onSearch={(query) => {
    console.log('Searching for:', query);
  }}
  onSelect={(result: SearchResult) => {
    console.log('Selected:', result);
    // Navigate to product or highlight it
  }}
  debounceMs={300}
  showSuggestions={true}
  minChars={1}
/>
```

## API Endpoint

### GET `/api/search/products`

Intelligent product search with fuzzy matching and ranking.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum results (default: 10)
- `warehouse_id` (optional): Filter by warehouse

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "SKU123",
      "category_name": "Category",
      "available_stock": 10,
      "total_stock": 15,
      "warehouse_name": "Main Warehouse",
      "match_type": "exact_sku",
      "match_score": 1000
    }
  ],
  "suggestions": ["SKU123", "Product Name"],
  "total": 25
}
```

**Match Types:**
- `exact_sku`: Exact SKU match
- `partial_sku`: Partial SKU match
- `exact_name`: Exact name match
- `partial_name`: Partial name match
- `fuzzy`: Fuzzy/word-based match

## Integration

### Products Page

The SmartSearch component is integrated into the Products page, replacing the basic search input. It:

- Respects warehouse and category filters
- Updates product list based on search
- Shows autocomplete suggestions
- Displays stock information in results

### Custom Integration

To use SmartSearch in other pages:

```typescript
import { SmartSearch } from '@/components/ui/SmartSearch';

function MyPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SmartSearch
      placeholder="Search..."
      onSearch={(query) => setSearchQuery(query)}
      onSelect={(result) => {
        // Handle selection
        console.log('Selected:', result);
      }}
    />
  );
}
```

## Search Algorithm

### Scoring System

Results are scored and ranked based on:

1. **Match Type Priority**
   - Exact SKU: 1000 points
   - Partial SKU (starts with): 800-900 points
   - Partial SKU (contains): 600-800 points
   - Exact Name: 500 points
   - Partial Name (starts with): 400-450 points
   - Partial Name (contains): 300-400 points
   - Category Match: 100 points
   - Fuzzy Match: 30-100 points

2. **Match Quality**
   - Longer matches score higher
   - Position matters (starts with > contains)
   - Multiple word matches add points

3. **Sorting**
   - Primary: Score (highest first)
   - Secondary: Name (alphabetical)

### Example Scoring

```
Search: "ABC"

Product A (SKU: "ABC123")
  - Exact SKU match: 1000 points
  - Rank: 1

Product B (SKU: "X-ABC-456")
  - Partial SKU (contains): 650 points
  - Rank: 2

Product C (Name: "ABC Widget")
  - Name starts with: 450 points
  - Rank: 3
```

## Best Practices

### 1. Search Terms
- **SKU Search**: Use exact or partial SKU codes
- **Name Search**: Use product names or partial names
- **Category Search**: Use category names

### 2. Performance
- Search is debounced (300ms default)
- Results limited to 10 by default
- Fuzzy matching only on word boundaries

### 3. User Experience
- Minimum 1 character to search
- Shows suggestions when no results
- Keyboard navigation for power users
- Visual match type indicators

### 4. Filtering
- Warehouse filter applied automatically
- Category filter works with search
- Multiple filters can be combined

## Advanced Features

### Custom Search Logic

You can extend the search API to add custom logic:

```typescript
// In /app/api/search/products/route.ts

// Add custom scoring
if (product.tags?.includes(searchTerm)) {
  matchScore += 200;
}

// Add custom filters
if (customFilter) {
  // Apply custom filter logic
}
```

### Search History

Track search history (future enhancement):

```typescript
// Store recent searches
const recentSearches = localStorage.getItem('recent-searches');
// Show in suggestions
```

### Search Analytics

Track search patterns (future enhancement):

```typescript
// Log search queries
analytics.track('product_search', {
  query: searchTerm,
  results_count: results.length,
  match_type: topResult.match_type
});
```

## Troubleshooting

### No Results Showing

1. **Check minimum characters**: Default is 1, increase if needed
2. **Check debounce**: Results appear after typing stops
3. **Check API**: Verify `/api/search/products` is accessible
4. **Check filters**: Warehouse/category filters may hide results

### Slow Search

1. **Increase debounce**: Set `debounceMs={500}` for slower typing
2. **Reduce limit**: Lower `limit` parameter
3. **Check database**: Ensure indexes on `sku` and `name` columns

### Wrong Results

1. **Check match type**: Review match badges in results
2. **Check scoring**: Verify scoring algorithm
3. **Check filters**: Ensure filters are correct

## Future Enhancements

Potential improvements:
- Search history
- Recent searches
- Popular searches
- Search analytics
- Advanced filters (price, stock level)
- Multi-select search
- Search in other entities (orders, transfers)
- Voice search
- Image search
- Barcode scanning integration

## Technical Details

### Component Location
- `/components/ui/SmartSearch.tsx`

### API Location
- `/app/api/search/products/route.ts`

### Dependencies
- `apiGet` from `/lib/api`
- `SearchResult` type from API
- Lucide React icons

### Performance
- Debounced API calls (300ms)
- Client-side filtering
- Efficient database queries
- Limited result sets

## Support

For issues or questions:
1. Check this guide
2. Review browser console for errors
3. Verify API endpoint is accessible
4. Check authentication status
5. Review search algorithm scoring

