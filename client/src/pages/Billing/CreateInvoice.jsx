import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Receipt, Plus, Trash2, ArrowLeft, DollarSign, Calculator } from 'lucide-react';
import { billingApi, patientApi, doctorApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const CreateInvoice = () => {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';

  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { formatCurrency, settings } = useHospitalConfig();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient: preselectedPatientId,
    doctor: '',
    paymentMethod: 'Cash',
    paidAmount: 0,
    notes: '',
    items: [
      {
        description: 'Doctor Consultation Fee',
        category: 'Consultation',
        quantity: 1,
        unitPrice: 100,
        discountPercentage: 0,
        taxPercentage: 0,
      },
    ],
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          patientApi.getAll({ limit: 100 }),
          doctorApi.getAll(),
        ]);
        if (pRes.data.success) setPatients(pRes.data.patients);
        if (dRes.data.success) setDoctors(dRes.data.doctors);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDependencies();
  }, []);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          category: 'Other Services',
          quantity: 1,
          unitPrice: 0,
          discountPercentage: 0,
          taxPercentage: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  // Calculations
  const calculateTotals = () => {
    let subTotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    formData.items.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const discPct = Number(item.discountPercentage) || 0;
      const taxPct = Number(item.taxPercentage) || 0;

      const base = qty * price;
      const disc = (base * discPct) / 100;
      const taxable = base - disc;
      const tax = (taxable * taxPct) / 100;

      subTotal += base;
      discountTotal += disc;
      taxTotal += tax;
    });

    const total = subTotal - discountTotal + taxTotal;
    const paid = Number(formData.paidAmount) || 0;
    const due = Math.max(0, total - paid);

    return { subTotal, discountTotal, taxTotal, total, paid, due };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient) {
      showToast('Please select a patient', 'warning');
      return;
    }

    if (formData.items.some((i) => !i.description || Number(i.unitPrice) < 0)) {
      showToast('Please verify all line items descriptions and prices', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await billingApi.createInvoice(formData);
      if (res.data.success) {
        showToast('Invoice generated successfully!', 'success');
        navigate(`/billing/invoices/${res.data.invoice._id}`);
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
      <div className="flex items-center justify-between">
        <Link
          to="/billing"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Invoices
        </Link>
        <h1 className="text-xl font-extrabold text-slate-900">Generate Patient Bill / Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Doctor Selection Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
            <select
              required
              value={formData.patient}
              onChange={(e) => setFormData((prev) => ({ ...prev, patient: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Choose Patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} ({p.patientId}) — {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor (Optional)</label>
            <select
              value={formData.doctor}
              onChange={(e) => setFormData((prev) => ({ ...prev, doctor: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Select Doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.user?.firstName} {d.user?.lastName} ({d.specialization})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Line Items Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Itemized Hospital Services & Charges</h2>
              <p className="text-xs text-slate-400">Add consultation, room charges, tests, procedures, and medicines</p>
            </div>
            <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddItem}>
              Add Service Item
            </Button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Service Category</label>
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Room / Bed Charge">Room / Bed Charge</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Pharmacy / Medicines">Pharmacy / Medicines</option>
                    <option value="Surgery / Procedure">Surgery / Procedure</option>
                    <option value="Nursing Care">Nursing Care</option>
                    <option value="Equipment / Consumables">Equipment / Consumables</option>
                    <option value="Other Services">Other Services</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Description *</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="e.g. ICU Charges, ECG Test"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-center"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Disc %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discountPercentage}
                    onChange={(e) => handleItemChange(idx, 'discountPercentage', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-center"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tax %</label>
                  <input
                    type="number"
                    min="0"
                    value={item.taxPercentage}
                    onChange={(e) => handleItemChange(idx, 'taxPercentage', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-center"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center pt-3">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Payment Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes & Payment Method */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="UPI">UPI / Digital QR</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Insurance">Insurance Claim</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Insurance pre-authorization, special discounts or remarks..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold">{formatCurrency(totals.subTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discounts Applied:</span>
              <span className="font-semibold">- {formatCurrency(totals.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Taxes:</span>
              <span className="font-semibold">+ {formatCurrency(totals.taxTotal)}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
              <span>Net Payable Amount:</span>
              <span className="text-primary-600">{formatCurrency(totals.total)}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Paid Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totals.total}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paidAmount: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-700 mb-1">Outstanding Balance</span>
                <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                  {formatCurrency(totals.due)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end space-x-3">
          <Link to="/billing">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Generate & Finalize Bill
          </Button>
        </div>
      </form>
    </div>
  );
};
