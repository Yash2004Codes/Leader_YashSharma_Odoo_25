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
import { Plus, Check, FileText } from 'lucide-react';
import { generateReceiptPDF } from '@/lib/pdf';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const alert = useAlert();
  const toast = useToast();
  const [formData, setFormData] = useState({
    supplier_name: '',
    warehouse_id: '',
    notes: '',
    items: [{ product_id: '', quantity: 0, unit_price: 0 }],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [receiptsData, productsData, warehousesData] = await Promise.all([
        apiGet<any[]>('/api/receipts'),
        apiGet<any[]>('/api/products'),
        apiGet<any[]>('/api/warehouses'),
      ]);
      setReceipts(receiptsData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost('/api/receipts', formData);
      setShowModal(false);
      setFormData({
        supplier_name: '',
        warehouse_id: '',
        notes: '',
        items: [{ product_id: '', quantity: 0, unit_price: 0 }],
      });
      await loadData();
      toast.success('Receipt created successfully!');
    } catch (error: any) {
      alert.error(error.message || 'Failed to create receipt');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await apiPut(`/api/receipts/${id}`, { status: 'done' });
      await loadData();
      toast.success('Receipt validated successfully!');
    } catch (error: any) {
      alert.error(error.message || 'Failed to validate receipt');
    }
  };

  const handlePrintPDF = async (receiptId: string) => {
    try {
      // Fetch full receipt data with items
      const receipt = await apiGet<any>(`/api/receipts/${receiptId}`);
      
      // Format receipt data for PDF
      const receiptData = {
        receipt_number: receipt.receipt_number,
        supplier_name: receipt.supplier_name,
        warehouse_name: receipt.warehouse_name,
        created_at: receipt.created_at,
        created_by_name: receipt.created_by_name,
        notes: receipt.notes,
        status: receipt.status,
        items: (receipt.items || []).map((item: any) => ({
          product_name: item.products?.name || 'N/A',
          sku: item.products?.sku || 'N/A',
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_of_measure: item.products?.unit_of_measure || '',
          notes: item.notes,
        })),
      };

      // Generate and download PDF
      generateReceiptPDF(receiptData);
      toast.success('PDF generated successfully!');
    } catch (error: any) {
      console.error('Print PDF error:', error);
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 0, unit_price: 0 }],
    });
  };

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Receipts (Incoming Stock)</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Receipt
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : receipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{receipt.receipt_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{receipt.supplier_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{receipt.warehouse_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            receipt.status === 'done'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(receipt.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintPDF(receipt.id)}
                            title="Print PDF"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                          {receipt.status !== 'done' && (
                            <Button
                              size="sm"
                              onClick={() => handleValidate(receipt.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Validate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No receipts found</div>
          )}
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Receipt</h2>
              <form onSubmit={handleCreateReceipt} className="space-y-4">
                <Input
                  label="Supplier Name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
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
