'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Package, Hash } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { SearchResult } from '@/app/api/search/products/route';

interface SmartSearchProps {
  placeholder?: string;
  onSelect?: (result: SearchResult) => void;
  onSearch?: (query: string) => void;
  warehouseId?: string;
  className?: string;
  debounceMs?: number;
  showSuggestions?: boolean;
  minChars?: number;
}

export function SmartSearch({
  placeholder = 'Search by SKU or product name...',
  onSelect,
  onSearch,
  warehouseId,
  className = '',
  debounceMs = 300,
  showSuggestions = true,
  minChars = 1,
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalResults, setTotalResults] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minChars) {
        setResults([]);
        setSuggestions([]);
        setTotalResults(0);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: searchQuery, limit: '10' });
        if (warehouseId) params.append('warehouse_id', warehouseId);

        const response = await apiGet<{
          results: SearchResult[];
          suggestions: string[];
          total: number;
        }>(`/api/search/products?${params.toString()}`);

        setResults(response.results || []);
        setSuggestions(response.suggestions || []);
        setTotalResults(response.total || 0);
        setShowDropdown(true);
        setSelectedIndex(-1);

        // Call onSearch callback
        if (onSearch) {
          onSearch(searchQuery);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [warehouseId, minChars, onSearch]
  );

  // Handle input change with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    setQuery(result.sku || result.name);
    setShowDropdown(false);
    if (onSelect) {
      onSelect(result);
    }
    inputRef.current?.blur();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMatchBadge = (matchType: SearchResult['match_type']) => {
    const badges = {
      exact_sku: { label: 'Exact SKU', color: 'bg-green-100 text-green-800' },
      partial_sku: { label: 'SKU Match', color: 'bg-blue-100 text-blue-800' },
      exact_name: { label: 'Exact Name', color: 'bg-purple-100 text-purple-800' },
      partial_name: { label: 'Name Match', color: 'bg-yellow-100 text-yellow-800' },
      fuzzy: { label: 'Related', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[matchType] || badges.fuzzy;
    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setSuggestions([]);
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (results.length > 0 || suggestions.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                Results {totalResults > results.length && `(${totalResults} total)`}
              </div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {result.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="font-mono">{result.sku}</span>
                        {result.category_name && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span>{result.category_name}</span>
                          </>
                        )}
                      </div>
                      {result.warehouse_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {result.warehouse_name}: {result.available_stock} available
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {getMatchBadge(result.match_type)}
                      {result.available_stock > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          {result.available_stock} in stock
                        </span>
                      )}
                      {result.available_stock === 0 && (
                        <span className="text-xs text-red-600 font-medium">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && results.length === 0 && (
            <div className="p-2 border-t border-gray-200">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Search className="h-3 w-3 inline mr-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {results.length === 0 && suggestions.length === 0 && !loading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

