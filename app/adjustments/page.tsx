'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { Plus, Check } from 'lucide-react';

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    warehouse_id: '',
    reason: '',
    notes: '',
    items: [{ product_id: '', counted_quantity: 0 }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adjustmentsData, productsData, warehousesData] = await Promise.all([
        apiGet<any[]>('/api/adjustments'),
        apiGet<any[]>('/api/products'),
        apiGet<any[]>('/api/warehouses'),
      ]);
      setAdjustments(adjustmentsData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost('/api/adjustments', formData);
      setShowModal(false);
      setFormData({
        warehouse_id: '',
        reason: '',
        notes: '',
        items: [{ product_id: '', counted_quantity: 0 }],
      });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create adjustment');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await apiPut(`/api/adjustments/${id}`, { status: 'done' });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to validate adjustment');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', counted_quantity: 0 }],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : adjustments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adjustment #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{adjustment.adjustment_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{adjustment.warehouse_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{adjustment.reason || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            adjustment.status === 'done'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {adjustment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(adjustment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {adjustment.status !== 'done' && (
                          <Button
                            size="sm"
                            onClick={() => handleValidate(adjustment.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Validate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No adjustments found</div>
          )}
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Stock Adjustment</h2>
              <form onSubmit={handleCreateAdjustment} className="space-y-4">
                <Select
                  label="Warehouse"
                  required
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Warehouse' },
                    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                />
                <Input
                  label="Reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Physical count, Damaged items"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Items (Enter counted quantity)</label>
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Select
                        value={item.product_id}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].product_id = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        options={[
                          { value: '', label: 'Select Product' },
                          ...products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` })),
                        ]}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Counted Qty"
                        value={item.counted_quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].counted_quantity = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-32"
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    Add Item
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Create</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
