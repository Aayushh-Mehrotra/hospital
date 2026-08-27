import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, HeartPulse, CheckCircle2 } from 'lucide-react';
import { billingApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const PrintableInvoice = () => {
  const { id } = useParams();
  const { formatCurrency, settings } = useHospitalConfig();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await billingApi.getInvoiceById(id);
        if (res.data.success) {
          setInvoiceData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!invoiceData || !invoiceData.invoice) {
    return (
      <div className="py-20 text-center text-slate-800">
        <p>Invoice not found.</p>
      </div>
    );
  }

  const invoice = invoiceData.invoice;
  const hospital = invoiceData.hospitalSettings || settings;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Floating Print Controls (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link
          to={`/billing/invoices/${invoice._id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoice Details
        </Link>
        <div className="flex items-center space-x-3">
          <Button variant="primary" size="md" icon={Printer} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official A4 Hospital Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 shadow-2xl border border-slate-200 printable-area text-slate-900 font-sans">
        {/* Hospital Branding Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-primary-700 pb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-primary-900 uppercase">
                {hospital.hospitalName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">{hospital.tagline}</p>
              <div className="text-xs text-slate-500 mt-1">
                {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state} {hospital.address?.postalCode}
              </div>
              <div className="text-xs text-slate-500">
                Helpline: <strong>{hospital.phone}</strong> • Emergency: <strong>{hospital.emergencyHelpline}</strong>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-900 font-black text-xs uppercase tracking-widest rounded-lg">
              TAX INVOICE
            </span>
            <div className="mt-2 text-xs font-mono">
              <div>Invoice #: <strong className="text-slate-900 text-sm">{invoice.invoiceNumber}</strong></div>
              <div>Billing Date: <strong>{formatDate(invoice.billingDate)}</strong></div>
              <div>Due Date: <strong>{formatDate(invoice.dueDate)}</strong></div>
            </div>
          </div>
        </div>

        {/* Patient & Doctor Information Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">PATIENT DETAILS</span>
            <strong className="text-slate-900 text-sm block">
              {invoice.patient?.firstName} {invoice.patient?.lastName}
            </strong>
            <div className="text-slate-600 mt-1 space-y-0.5">
              <div>Patient ID: <strong className="font-mono">{invoice.patient?.patientId}</strong></div>
              <div>Age / Gender: {invoice.patient?.age} Yrs / {invoice.patient?.gender}</div>
              <div>Contact: {invoice.patient?.phone}</div>
              <div>
                Address: {invoice.patient?.address?.street}, {invoice.patient?.address?.city}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CONSULTATION / CLINIC</span>
            {invoice.doctor ? (
              <>
                <strong className="text-slate-900 text-sm block">
                  Dr. {invoice.doctor?.user?.firstName} {invoice.doctor?.user?.lastName}
                </strong>
                <div className="text-slate-600 mt-1 space-y-0.5">
                  <div>Department: {invoice.doctor?.department?.name}</div>
                  <div>Specialization: {invoice.doctor?.specialization}</div>
                  <div>Room: {invoice.doctor?.roomNumber}</div>
                </div>
              </>
            ) : (
              <span className="text-slate-600">Hospital Inpatient / Outpatient Services</span>
            )}
            <div className="mt-2 text-slate-600">
              Payment Terms: <strong className="text-slate-800">{invoice.paymentMethod}</strong>
            </div>
          </div>
        </div>

        {/* Itemized Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-primary-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 rounded-l-lg">#</th>
                <th className="py-3 px-3">Service & Charge Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Rate</th>
                <th className="py-3 px-3 text-center">Disc</th>
                <th className="py-3 px-3 text-center">Tax</th>
                <th className="py-3 px-3 text-right rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 px-3 text-slate-400 font-mono">{i + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{item.description}</td>
                  <td className="py-3 px-3 text-slate-500">{item.category}</td>
                  <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-3 text-center text-slate-500">{item.discountPercentage}%</td>
                  <td className="py-3 px-3 text-center text-slate-500">{item.taxPercentage}%</td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Signature Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-200">
          {/* Payment Status Stamp */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase">
              <span>Status:</span>
              <span
                className={
                  invoice.paymentStatus === 'Paid'
                    ? 'text-emerald-700'
                    : invoice.paymentStatus === 'Partially Paid'
                    ? 'text-blue-700'
                    : 'text-amber-700'
                }
              >
                {invoice.paymentStatus}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 italic max-w-sm">
              "{hospital.invoiceFooterNote}"
            </div>
          </div>

          {/* Totals Table */}
          <div className="space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold">{formatCurrency(invoice.subTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Discounts Applied:</span>
              <span className="font-semibold">- {formatCurrency(invoice.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes:</span>
              <span className="font-semibold">+ {formatCurrency(invoice.taxTotal)}</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-300 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Net Payable Amount:</span>
              <span className="text-primary-800 text-base">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Amount Paid:</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Authorized Signature */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div className="font-mono text-[10px]">CarePulse Health OS • Hospital Management Verification</div>
            <div className="text-[10px]">Registered Under Healthcare Authority Reg #: {hospital.registrationNumber}</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-1.5" />
            <strong className="text-slate-800 text-xs block">{hospital.authorizedSignatoryName}</strong>
            <span className="text-[10px] text-slate-400">Authorized Signature & Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};
