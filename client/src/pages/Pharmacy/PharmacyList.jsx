import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { pharmacyApi, supplierApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const PharmacyList = () => {
  const { showToast } = useNotification();
  const { formatCurrency } = useHospitalConfig();

  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [expiringFilter, setExpiringFilter] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Medicine Form
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    form: 'Tablet',
    strength: '500mg',
    supplier: '',
    batchNumber: '',
    manufacturingDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    purchasePrice: 2.0,
    sellingPrice: 5.0,
    stockQuantity: 100,
    reorderLevel: 20,
    unit: 'Strips',
    storageLocation: 'Shelf A1',
  });

  // Stock Adjustment Form
  const [stockForm, setStockForm] = useState({
    adjustmentType: 'STOCK_IN',
    quantity: 50,
    reason: 'Restock order from supplier',
    referenceNumber: '',
  });

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.getMedicines({
        search,
        category: categoryFilter,
        lowStock: lowStockFilter ? 'true' : '',
        expiringSoon: expiringFilter ? 'true' : '',
      });
      if (res.data.success) {
        setMedicines(res.data.medicines);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await supplierApi.getAll();
      if (res.data.success) setSuppliers(res.data.suppliers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchMedicines, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockFilter, expiringFilter]);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await pharmacyApi.createMedicine(medForm);
      if (res.data.success) {
        showToast('Medicine registered successfully!', 'success');
        setIsAddModalOpen(false);
        fetchMedicines();
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
      const res = await pharmacyApi.adjustStock(selectedMedicine._id, stockForm);
      if (res.data.success) {
        showToast('Stock adjusted and recorded in inventory ledger!', 'success');
        setIsStockModalOpen(false);
        fetchMedicines();
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
            <Pill className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pharmacy & Medicine Stock</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage drug formulary, track batch expiry dates, and monitor real-time stock levels.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
          Add New Medicine
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Medicine, Generic, Batch #..."
          className="w-full md:w-80"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Analgesics / Pain Relief">Analgesics / Pain Relief</option>
            <option value="Antidiabetic">Antidiabetic</option>
            <option value="IV Fluids & Electrolytes">IV Fluids</option>
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

          <button
            onClick={() => setExpiringFilter(!expiringFilter)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center ${
              expiringFilter
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            Expiring Soon
          </button>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-slate-400">Loading pharmacy stock...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No medicines found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Medicine ID</th>
                  <th className="py-3 px-4">Medicine & Generic</th>
                  <th className="py-3 px-4">Category / Form</th>
                  <th className="py-3 px-4">Batch #</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((med) => {
                  const isLow = med.stockQuantity <= med.reorderLevel;
                  const isExpiring = new Date(med.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={med._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary-600">{med.medicineId}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500 italic">{med.genericName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{med.category}</div>
                        <div className="text-[11px] text-slate-400">{med.form} • {med.strength}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{med.batchNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            isExpiring ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-slate-600'
                          }`}
                        >
                          {formatDate(med.expiryDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(med.sellingPrice)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isLow
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {med.stockQuantity} {med.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMedicine(med);
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

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Medicine"
        subtitle="Add drug item with batch details, pricing, and stock"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={medForm.name}
                onChange={(e) => setMedForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Amoxicillin 625mg"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
              <input
                type="text"
                required
                value={medForm.genericName}
                onChange={(e) => setMedForm((prev) => ({ ...prev, genericName: e.target.value }))}
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={medForm.category}
                onChange={(e) => setMedForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics / Pain Relief">Analgesics / Pain Relief</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="IV Fluids & Electrolytes">IV Fluids</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Form</label>
              <select
                value={medForm.form}
                onChange={(e) => setMedForm((prev) => ({ ...prev, form: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup / Liquid">Syrup / Liquid</option>
                <option value="Injection">Injection</option>
                <option value="IV Infusion">IV Infusion</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Strength / Dosage</label>
              <input
                type="text"
                value={medForm.strength}
                onChange={(e) => setMedForm((prev) => ({ ...prev, strength: e.target.value }))}
                placeholder="500mg"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
              <input
                type="text"
                required
                value={medForm.batchNumber}
                onChange={(e) => setMedForm((prev) => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="AMX-2026-B1"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mfg Date *</label>
              <input
                type="date"
                required
                value={medForm.manufacturingDate}
                onChange={(e) => setMedForm((prev) => ({ ...prev, manufacturingDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={medForm.expiryDate}
                onChange={(e) => setMedForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={medForm.purchasePrice}
                onChange={(e) => setMedForm((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={medForm.sellingPrice}
                onChange={(e) => setMedForm((prev) => ({ ...prev, sellingPrice: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock *</label>
              <input
                type="number"
                required
                value={medForm.stockQuantity}
                onChange={(e) => setMedForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Alert Level</label>
              <input
                type="number"
                value={medForm.reorderLevel}
                onChange={(e) => setMedForm((prev) => ({ ...prev, reorderLevel: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Register Medicine
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          title={`Adjust Stock: ${selectedMedicine.name}`}
          subtitle={`Current Available Stock: ${selectedMedicine.stockQuantity} ${selectedMedicine.unit}`}
        >
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Action *</label>
              <select
                value={stockForm.adjustmentType}
                onChange={(e) => setStockForm((prev) => ({ ...prev, adjustmentType: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500"
              >
                <option value="STOCK_IN">Stock In (Purchase / Restock)</option>
                <option value="STOCK_OUT">Stock Out (Transfer)</option>
                <option value="DAMAGE">Discard Damaged</option>
                <option value="EXPIRED_REMOVAL">Remove Expired Stock</option>
                <option value="SET_EXACT">Physical Audit Count (Set Exact)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity ({selectedMedicine.unit}) *</label>
              <input
                type="number"
                min="1"
                required
                value={stockForm.quantity}
                onChange={(e) => setStockForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / PO Reference</label>
              <input
                type="text"
                value={stockForm.reason}
                onChange={(e) => setStockForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsStockModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save Stock Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
