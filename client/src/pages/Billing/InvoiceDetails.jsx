import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Receipt, ArrowLeft, Printer, DollarSign, CreditCard, User, Building2 } from 'lucide-react';
import { billingApi, paymentApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const InvoiceDetails = () => {
  const { id } = useParams();
  const { formatCurrency, settings } = useHospitalConfig();
  const { showToast } = useNotification();

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Record payment modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await billingApi.getInvoiceById(id);
      if (res.data.success) {
        setInvoiceData(res.data);
        setPayAmount(res.data.invoice.dueAmount || 0);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid payment amount', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentApi.recordPayment({
        invoiceId: invoiceData.invoice._id,
        amount,
        paymentMethod: payMethod,
        transactionReference: payRef,
        notes: payNotes,
      });

      if (res.data.success) {
        showToast('Payment recorded successfully!', 'success');
        setPayModalOpen(false);
        fetchInvoice();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p className="mt-2 text-xs text-slate-400">Loading invoice details...</p>
      </div>
    );
  }

  if (!invoiceData || !invoiceData.invoice) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800">Invoice not found</h2>
        <Link to="/billing" className="mt-2 inline-block text-xs text-primary-600 font-semibold">
          ← Back to Invoices
        </Link>
      </div>
    );
  }

  const invoice = invoiceData.invoice;
  const payments = invoiceData.payments || [];

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/billing"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Invoices
        </Link>

        <div className="flex items-center space-x-2">
          {invoice.dueAmount > 0 && (
            <Button variant="success" size="sm" icon={CreditCard} onClick={() => setPayModalOpen(true)}>
              Record Payment
            </Button>
          )}
          <Link to={`/billing/invoices/${invoice._id}/print`} target="_blank">
            <Button variant="primary" size="sm" icon={Printer}>
              Print Official Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Invoice Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-extrabold text-primary-700">{invoice.invoiceNumber}</span>
              <Badge status={invoice.paymentStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Billing Date: {formatDate(invoice.billingDate, true)} • Due Date: {formatDate(invoice.dueDate)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
            <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>

        {/* Patient & Doctor Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">BILLED TO (PATIENT)</span>
            <strong className="text-slate-900 text-sm block">
              {invoice.patient?.firstName} {invoice.patient?.lastName}
            </strong>
            <div className="text-slate-500 mt-1 space-y-0.5">
              <div>Patient ID: <strong className="font-mono text-slate-700">{invoice.patient?.patientId}</strong></div>
              <div>Phone: {invoice.patient?.phone}</div>
              <div>Email: {invoice.patient?.email || '—'}</div>
              <div>
                Address: {invoice.patient?.address?.street}, {invoice.patient?.address?.city}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ATTENDING CLINICIAN</span>
            {invoice.doctor ? (
              <>
                <strong className="text-slate-900 text-sm block">
                  Dr. {invoice.doctor?.user?.firstName} {invoice.doctor?.user?.lastName}
                </strong>
                <div className="text-slate-500 mt-1">
                  <div>Department: {invoice.doctor?.department?.name}</div>
                  <div>Specialization: {invoice.doctor?.specialization}</div>
                </div>
              </>
            ) : (
              <span className="text-slate-500">Hospital General Outpatient / Inpatient Services</span>
            )}
            <div className="mt-2 text-slate-400">
              Payment Method: <strong className="text-slate-700">{invoice.paymentMethod}</strong>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Service / Charge Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-center">Disc %</th>
                <th className="py-2.5 px-3 text-center">Tax %</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-center text-slate-500">{item.discountPercentage || 0}%</td>
                  <td className="py-2.5 px-3 text-center text-slate-500">{item.taxPercentage || 0}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Breakdown */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold">{formatCurrency(invoice.subTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Discounts:</span>
              <span className="font-semibold">- {formatCurrency(invoice.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({settings.taxRatePercentage}%):</span>
              <span className="font-semibold">+ {formatCurrency(invoice.taxTotal)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-primary-700">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Total Paid:</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold">
              <span>Outstanding Due:</span>
              <span>{formatCurrency(invoice.dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Receipts History */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Recorded Transaction Receipts ({payments.length})</h3>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-400">No payment receipts recorded for this bill.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <div key={p._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-primary-600 mr-2">{p.paymentId}</span>
                    <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                    {p.transactionReference && (
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">({p.transactionReference})</span>
                    )}
                    {p.receivedBy && (
                      <span className="text-slate-400 ml-2">by {p.receivedBy.firstName} {p.receivedBy.lastName}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                    <span className="text-slate-400 text-[11px]">{formatDate(p.paymentDate, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment Receipt"
        subtitle={`Invoice: ${invoice.invoiceNumber} • Outstanding Due: ${formatCurrency(invoice.dueAmount)}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              max={invoice.dueAmount}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="UPI">UPI / Digital QR</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Insurance">Insurance Settlement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction / Reference #</label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. TXN-POS-8891, UPI Ref ID"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cashier Remarks</label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Counter payment remarks..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm" loading={submitting}>
              Confirm & Post Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
