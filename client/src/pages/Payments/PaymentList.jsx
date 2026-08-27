import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Download, Search, DollarSign, CheckCircle2, ArrowLeft } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportData';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const PaymentList = () => {
  const { showToast } = useNotification();
  const { formatCurrency } = useHospitalConfig();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAll({ search, paymentMethod: methodFilter });
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPayments, 300);
    return () => clearTimeout(timer);
  }, [search, methodFilter]);

  const handleExportCSV = () => {
    const exportData = payments.map((p) => ({
      'Payment ID': p.paymentId,
      'Invoice #': p.invoice?.invoiceNumber,
      Patient: `${p.patient?.firstName} ${p.patient?.lastName}`,
      'Patient ID': p.patient?.patientId,
      Amount: p.amount,
      'Payment Method': p.paymentMethod,
      'Transaction Ref': p.transactionReference,
      Cashier: `${p.receivedBy?.firstName} ${p.receivedBy?.lastName}`,
      Date: formatDate(p.paymentDate, true),
    }));
    exportToCSV(exportData, `hospital-payments-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payments & Receipts Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit log of all counter settlements, card swipes, UPI payments, and insurance payouts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/billing">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Invoices
            </Button>
          </Link>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Payment ID, Transaction Ref, Patient..."
          className="w-full md:w-80"
        />

        <div className="flex flex-wrap items-center gap-2">
          {['', 'Cash', 'Card', 'UPI', 'Bank Transfer', 'Insurance'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                methodFilter === m ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {m || 'All Methods'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-slate-400">Loading payment records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Cashier / Staff</th>
                  <th className="py-3 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-600">{pay.paymentId}</td>
                    <td className="py-3 px-4">
                      {pay.invoice ? (
                        <Link
                          to={`/billing/invoices/${pay.invoice._id}`}
                          className="font-mono font-bold text-slate-800 hover:text-primary-600"
                        >
                          {pay.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {pay.patient?.firstName} {pay.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">ID: {pay.patient?.patientId}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 text-sm">{formatCurrency(pay.amount)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{pay.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{pay.transactionReference || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {pay.receivedBy?.firstName} {pay.receivedBy?.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(pay.paymentDate, true)}</td>
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
