'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { AlertModal } from '@/components/ui/Modal';
import { useAlert } from '@/lib/hooks/useAlert';
import { useToast } from '@/lib/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { Plus, Check } from 'lucide-react';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const alert = useAlert();
  const toast = useToast();
  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    notes: '',
    items: [{ product_id: '', quantity: 0 }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transfersData, productsData, warehousesData] = await Promise.all([
        apiGet<any[]>('/api/transfers'),
        apiGet<any[]>('/api/products'),
        apiGet<any[]>('/api/warehouses'),
      ]);
      setTransfers(transfersData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      alert.warning('Source and destination warehouses must be different');
      return;
    }
    try {
      await apiPost('/api/transfers', formData);
      setShowModal(false);
      setFormData({
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: '',
        items: [{ product_id: '', quantity: 0 }],
      });
      await loadData();
      toast.success('Transfer created successfully!');
    } catch (error: any) {
      alert.error(error.message || 'Failed to create transfer');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await apiPut(`/api/transfers/${id}`, { status: 'done' });
      await loadData();
      toast.success('Transfer validated successfully!');
    } catch (error: any) {
      alert.error(error.message || 'Failed to validate transfer');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 0 }],
    });
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AlertModal
        isOpen={alert.alert.isOpen}
        onClose={alert.closeAlert}
        title={alert.alert.title || 'Alert'}
        message={alert.alert.message}
        type={alert.alert.type}
        onConfirm={alert.alert.onConfirm}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Internal Transfers</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : transfers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{transfer.transfer_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transfer.from_warehouse_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transfer.to_warehouse_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transfer.status === 'done'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transfer.status !== 'done' && (
                          <Button
                            size="sm"
                            onClick={() => handleValidate(transfer.id)}
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
            <div className="text-center py-8 text-gray-500">No transfers found</div>
          )}
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Internal Transfer</h2>
              <form onSubmit={handleCreateTransfer} className="space-y-4">
                <Select
                  label="From Warehouse"
                  required
                  value={formData.from_warehouse_id}
                  onChange={(e) => setFormData({ ...formData, from_warehouse_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Warehouse' },
                    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                />
                <Select
                  label="To Warehouse"
                  required
                  value={formData.to_warehouse_id}
                  onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Warehouse' },
                    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Items</label>
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
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].quantity = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-24"
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
