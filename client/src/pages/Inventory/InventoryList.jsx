import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownRight, History, Layers } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const InventoryList = () => {
  const { showToast } = useNotification();
  const { formatCurrency } = useHospitalConfig();

  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Consumables & PPE',
    unit: 'Boxes',
    quantity: 50,
    minThreshold: 10,
    unitCost: 15,
    location: 'Central Supply Warehouse',
    sku: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    type: 'RESTOCK',
    quantity: 20,
    notes: 'Warehouse delivery',
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [itRes, txRes] = await Promise.all([
        inventoryApi.getItems({ search, category: categoryFilter, lowStock: lowStockFilter ? 'true' : '' }),
        inventoryApi.getTransactions(),
      ]);
      if (itRes.data.success) setItems(itRes.data.items);
      if (txRes.data.success) setTransactions(txRes.data.transactions);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchInventory, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockFilter]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await inventoryApi.createItem(itemForm);
      if (res.data.success) {
        showToast('Inventory item created successfully!', 'success');
        setIsAddModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await inventoryApi.adjustStock(selectedItem._id, adjustForm);
      if (res.data.success) {
        showToast('Stock count adjusted!', 'success');
        setIsStockModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hospital Supplies & Equipment</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Central store inventory, surgical tools, consumables, and stock movements.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
          Add Supply Item
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'items', label: 'Supplies Catalog', icon: Layers, badge: items.length },
          { id: 'transactions', label: 'Stock Movement Ledger', icon: History, badge: transactions.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by Name, SKU, Location..."
              className="w-full md:w-80"
            />

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">All Categories</option>
                <option value="Consumables & PPE">Consumables & PPE</option>
                <option value="Surgical Equipment">Surgical Equipment</option>
                <option value="Biomedical Supplies">Biomedical Supplies</option>
                <option value="Emergency & Trauma">Emergency & Trauma</option>
              </select>

              <button
                onClick={() => setLowStockFilter(!lowStockFilter)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center ${
                  lowStockFilter
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Low Stock
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                <p className="mt-2 text-xs text-slate-400">Loading supply items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400">No items found matching filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Item ID</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Unit Cost</th>
                      <th className="py-3 px-4">Available Quantity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const isLow = item.quantity <= item.minThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-primary-600">{item.itemId}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.sku && <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.category}</td>
                          <td className="py-3 px-4 text-slate-600">{item.location}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{formatCurrency(item.unitCost)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isLow
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {item.quantity} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsStockModalOpen(true);
                              }}
                            >
                              Adjust Stock
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">
            Stock Movements & Audit Log
          </div>
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No stock transactions logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tx ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Item / Medicine</th>
                    <th className="py-3 px-4 text-center">Qty Change</th>
                    <th className="py-3 px-4 text-center">Previous → New</th>
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary-600">{tx.transactionId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type.includes('IN') || tx.type === 'RESTOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {tx.inventoryItem?.name || tx.medicine?.name || 'Item'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {tx.type.includes('IN') || tx.type === 'RESTOCK' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono">
                        {tx.previousStock} → {tx.newStock}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.performedBy?.firstName} {tx.performedBy?.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(tx.createdAt, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Supply Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hospital Supply Item"
        subtitle="Record equipment or medical consumables"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={itemForm.name}
              onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Sterile Surgical Gloves (Size 7.5)"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="Consumables & PPE">Consumables & PPE</option>
                <option value="Surgical Equipment">Surgical Equipment</option>
                <option value="Biomedical Supplies">Biomedical Supplies</option>
                <option value="Emergency & Trauma">Emergency & Trauma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={itemForm.unit}
                onChange={(e) => setItemForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="Boxes, Units, Packs"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Qty *</label>
              <input
                type="number"
                required
                value={itemForm.quantity}
                onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Threshold</label>
              <input
                type="number"
                value={itemForm.minThreshold}
                onChange={(e) => setItemForm((prev) => ({ ...prev, minThreshold: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.unitCost}
                onChange={(e) => setItemForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location</label>
              <input
                type="text"
                value={itemForm.location}
                onChange={(e) => setItemForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Central Supply Store Bay 4"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={itemForm.sku}
                onChange={(e) => setItemForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g. MED-GLV-001"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Add Supply
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <Modal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          title={`Adjust Quantity: ${selectedItem.name}`}
          subtitle={`Current In Stock: ${selectedItem.quantity} ${selectedItem.unit}`}
        >
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type *</label>
              <select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="RESTOCK">Restock (Received Shipment)</option>
                <option value="TRANSFER">Department Issue / Transfer</option>
                <option value="DAMAGE">Damaged / Discarded</option>
                <option value="AUDIT">Inventory Audit (Physical Count)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity ({selectedItem.unit}) *</label>
              <input
                type="number"
                min="1"
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Notes</label>
              <input
                type="text"
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Department requisition #, vendor delivery note..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsStockModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save Movement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
