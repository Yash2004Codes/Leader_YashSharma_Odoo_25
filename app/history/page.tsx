'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { apiGet } from '@/lib/api';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    product_id: '',
    warehouse_id: '',
    transaction_type: '',
  });

  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadWarehouses = async () => {
    try {
      const data = await apiGet<any[]>('/api/warehouses');
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await apiGet<any[]>('/api/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.warehouse_id) params.append('warehouse_id', filters.warehouse_id);
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);

      const data = await apiGet<any[]>(`/api/transfers/history?${params.toString()}`);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      receipt: 'Receipt',
      delivery: 'Delivery',
      transfer_in: 'Transfer In',
      transfer_out: 'Transfer Out',
      adjustment: 'Adjustment',
      initial_stock: 'Initial Stock',
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Move History (Stock Ledger)</h1>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Product"
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              options={[
                { value: '', label: 'All Products' },
                ...products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` })),
              ]}
            />
            <Select
              label="Warehouse"
              value={filters.warehouse_id}
              onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
              options={[
                { value: '', label: 'All Warehouses' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
            <Select
              label="Transaction Type"
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
              options={[
                { value: '', label: 'All Types' },
                { value: 'receipt', label: 'Receipt' },
                { value: 'delivery', label: 'Delivery' },
                { value: 'transfer_in', label: 'Transfer In' },
                { value: 'transfer_out', label: 'Transfer Out' },
                { value: 'adjustment', label: 'Adjustment' },
                { value: 'initial_stock', label: 'Initial Stock' },
              ]}
            />
          </div>
        </Card>

        {/* History Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Before</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">After</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.product_name} ({entry.sku})
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{entry.warehouse_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getTransactionTypeLabel(entry.transaction_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{entry.reference_number || 'N/A'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        entry.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.quantity_before}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.quantity_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No history found</div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
