'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ToastContainer } from '@/components/ui/Toast';
import { SmartSearch } from '@/components/ui/SmartSearch';
import { useToast } from '@/lib/hooks/useToast';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { SearchResult } from '@/app/api/search/products/route';
import { Plus, Search, Edit } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    unit_of_measure: '',
    description: '',
    reorder_level: 0,
    reorder_quantity: 0,
    initial_stock_warehouse: '',
    initial_stock_quantity: 0,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseFilter, categoryFilter, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (warehouseFilter) params.append('warehouse_id', warehouseFilter);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (search) params.append('search', search);

      const [productsData, warehousesData, categoriesData] = await Promise.all([
        apiGet<any[]>(`/api/products?${params.toString()}`),
        apiGet<any[]>('/api/warehouses'),
        apiGet<any[]>('/api/products/categories'),
      ]);

      setProducts(productsData);
      setWarehouses(warehousesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category_id: '',
      unit_of_measure: '',
      description: '',
      reorder_level: 0,
      reorder_quantity: 0,
      initial_stock_warehouse: '',
      initial_stock_quantity: 0,
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data - convert empty category_id to null
      const submitData: any = {
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id || null,
        unit_of_measure: formData.unit_of_measure,
        description: formData.description || null,
        reorder_level: formData.reorder_level || 0,
        reorder_quantity: formData.reorder_quantity || 0,
      };

      // Add initial stock if warehouse and quantity are provided
      if (formData.initial_stock_warehouse && formData.initial_stock_quantity > 0) {
        submitData.initial_stock = {
          warehouse_id: formData.initial_stock_warehouse,
          quantity: formData.initial_stock_quantity,
        };
      }
      
      await apiPost('/api/products', submitData);
      setShowModal(false);
      resetForm();
      await loadData();
      toast.success('Product created successfully!');
    } catch (error: any) {
      console.error('Create product error:', error);
      toast.error(error.message || 'Failed to create product. Please check console for details.');
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category_id: product.category_id || '',
      unit_of_measure: product.unit_of_measure || '',
      description: product.description || '',
      reorder_level: product.reorder_level || 0,
      reorder_quantity: product.reorder_quantity || 0,
      initial_stock_warehouse: '',
      initial_stock_quantity: 0,
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const submitData: any = {
        name: formData.name,
        category_id: formData.category_id || null,
        unit_of_measure: formData.unit_of_measure,
        description: formData.description || null,
        reorder_level: formData.reorder_level || 0,
        reorder_quantity: formData.reorder_quantity || 0,
      };

      await apiPut(`/api/products/${editingProduct.id}`, submitData);
      setShowEditModal(false);
      setEditingProduct(null);
      resetForm();
      await loadData();
      toast.success('Product updated successfully!');
    } catch (error: any) {
      console.error('Update product error:', error);
      toast.error(error.message || 'Failed to update product. Please check console for details.');
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SmartSearch
              placeholder="Search by SKU or product name..."
              warehouseId={warehouseFilter || undefined}
              onSearch={(query) => {
                setSearch(query);
              }}
              onSelect={(result) => {
                setSearch(result.sku || result.name);
                // Optionally filter to show only this product
                // You could navigate or highlight the selected product
              }}
              className="w-full"
            />
            <Select
              label="Warehouse"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              options={[
                { value: '', label: 'All Warehouses' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.total_stock - product.total_reserved} {product.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.is_out_of_stock ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : product.is_low_stock ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No products found</div>
          )}
        </Card>

        {/* Create Product Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Product"
          size="lg"
          position="center"
          scrollable={true}
        >
          <form onSubmit={handleCreateProduct} className="space-y-4">
                <Input
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="SKU"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
                <Select
                  label="Category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Input
                  label="Unit of Measure"
                  required
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  placeholder="e.g., kg, pcs, units"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Product description (optional)"
                  />
                </div>
                <Input
                  label="Reorder Level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <Input
                  label="Reorder Quantity"
                  type="number"
                  min="0"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Initial Stock (Optional)</h3>
                  <div className="space-y-3">
                    <Select
                      label="Warehouse"
                      value={formData.initial_stock_warehouse}
                      onChange={(e) => setFormData({ ...formData, initial_stock_warehouse: e.target.value })}
                      options={[
                        { value: '', label: 'Select Warehouse (optional)' },
                        ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                      ]}
                    />
                    <Input
                      label="Initial Quantity"
                      type="number"
                      min="0"
                      value={formData.initial_stock_quantity}
                      onChange={(e) => setFormData({ ...formData, initial_stock_quantity: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      disabled={!formData.initial_stock_warehouse}
                    />
                    {formData.initial_stock_warehouse && formData.initial_stock_quantity > 0 && (
                      <p className="text-xs text-gray-500">
                        Stock will be set to {formData.initial_stock_quantity} {formData.unit_of_measure || 'units'} in selected warehouse
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Create Product</Button>
                </div>
              </form>
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
            resetForm();
          }}
          title="Edit Product"
          size="lg"
          position="center"
          scrollable={true}
        >
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="SKU"
              value={editingProduct?.sku || ''}
              disabled
              className="bg-gray-100"
            />
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={[
                { value: '', label: 'Select Category' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              label="Unit of Measure"
              required
              value={formData.unit_of_measure}
              onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
              placeholder="e.g., kg, pcs, units"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Product description (optional)"
              />
            </div>
            <Input
              label="Reorder Level"
              type="number"
              min="0"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Reorder Quantity"
              type="number"
              min="0"
              value={formData.reorder_quantity}
              onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Update Product</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
