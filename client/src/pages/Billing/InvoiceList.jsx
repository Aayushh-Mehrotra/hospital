import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Plus, Search, Eye, Printer, DollarSign, CreditCard } from 'lucide-react';
import { billingApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const InvoiceList = () => {
  const { showToast } = useNotification();
  const { formatCurrency } = useHospitalConfig();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await billingApi.getInvoices({ search, paymentStatus: paymentStatusFilter });
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timer);
  }, [search, paymentStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hospital Invoices & Billing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient invoices, itemized charges, partial payments, and receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/payments">
            <Button variant="outline" size="sm" icon={CreditCard}>
              Payments Ledger
            </Button>
          </Link>
          <Link to="/billing/create">
            <Button variant="primary" size="sm" icon={Plus}>
              Create New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Invoice #, Patient..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-2">
          {['', 'Paid', 'Partially Paid', 'Pending'].map((st) => (
            <button
              key={st}
              onClick={() => setPaymentStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                paymentStatusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st || 'All Invoices'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-slate-400">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No invoices found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        to={`/billing/invoices/${inv._id}`}
                        className="font-mono font-bold text-primary-600 hover:text-primary-800"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {inv.patient?.firstName} {inv.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">ID: {inv.patient?.patientId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.billingDate)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      {inv.dueAmount > 0 ? formatCurrency(inv.dueAmount) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={inv.paymentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/billing/invoices/${inv._id}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Link>
                        <Link
                          to={`/billing/invoices/${inv._id}/print`}
                          target="_blank"
                          className="px-2.5 py-1 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold inline-flex items-center"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Print
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
