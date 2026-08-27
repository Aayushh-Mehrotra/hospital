import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Activity,
  BedDouble,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { exportToCSV } from '../../utils/exportData';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

const PIE_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const Reports = () => {
  const { formatCurrency } = useHospitalConfig();
  const [activeTab, setActiveTab] = useState('financial');
  const [loading, setLoading] = useState(true);
  const [finData, setFinData] = useState(null);
  const [clinData, setClinData] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([
        reportApi.getFinancial(dateRange),
        reportApi.getClinical(dateRange),
      ]);
      if (fRes.data.success) setFinData(fRes.data);
      if (cRes.data.success) setClinData(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportFinancial = () => {
    if (!finData) return;
    const rows = (finData.dailyRevenue || []).map((d) => ({
      Date: d._id,
      'Revenue ($)': d.total,
      'Invoices Issued': d.count,
    }));
    exportToCSV(rows, `financial-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
  };

  const handleExportClinical = () => {
    if (!clinData) return;
    const rows = (clinData.doctorWorkload || []).map((d) => ({
      Doctor: `Dr. ${d.doctorInfo?.firstName} ${d.doctorInfo?.lastName}`,
      'Consultations Done': d.totalAppointments,
    }));
    exportToCSV(rows, `clinical-workload-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hospital Analytics & Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive financial summaries, patient demographics, and department throughput metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="border-0 bg-transparent text-xs font-semibold focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="border-0 bg-transparent text-xs font-semibold focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={activeTab === 'financial' ? handleExportFinancial : handleExportClinical}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'financial', label: 'Financial & Revenue Analytics', icon: DollarSign },
          { id: 'clinical', label: 'Clinical Caseload & Workload', icon: Activity },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-2 text-xs text-slate-400">Compiling executive hospital metrics...</p>
        </div>
      ) : activeTab === 'financial' && finData ? (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Billed Total</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(finData.totals?.totalBilled || 0)}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Collected Revenue</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(finData.totals?.totalPaid || 0)}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-rose-600 uppercase">Outstanding Receivables</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(finData.totals?.totalDue || 0)}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-primary-600 uppercase">Total Invoices</span>
              <div className="text-2xl font-black text-primary-900 mt-1">{finData.totals?.count || 0}</div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Daily Revenue Trajectory</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finData.dailyRevenue || []}>
                  <defs>
                    <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Area type="monotone" dataKey="total" name="Daily Revenue" stroke="#0284c7" strokeWidth={3} fill="url(#finGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
              <h3 className="text-base font-extrabold text-slate-900 mb-4">Payment Methods Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finData.paymentMethods || []}
                      dataKey="total"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {(finData.paymentMethods || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
              <h3 className="text-base font-extrabold text-slate-900 mb-4">Revenue Breakdown Summary</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(finData.paymentMethods || []).map((m, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-bold text-slate-800">{m._id}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900">{formatCurrency(m.total)}</strong>
                      <span className="text-[11px] text-slate-400 block">{m.count} transactions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'clinical' && clinData ? (
        <div className="space-y-6">
          {/* Clinical Workload Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Doctor Consultation Caseload</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(clinData.doctorWorkload || []).map((d) => ({
                    doctor: `Dr. ${d.doctorInfo?.lastName || 'Doc'}`,
                    appointments: d.totalAppointments,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="doctor" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="appointments" name="Consultations Completed" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
              <h3 className="text-base font-extrabold text-slate-900 mb-4">Appointments by Department</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(clinData.departmentBreakdown || []).map((dept) => ({
                        name: dept.deptInfo?.name || 'General',
                        value: dept.count,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {(clinData.departmentBreakdown || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
              <h3 className="text-base font-extrabold text-slate-900 mb-4">Appointment Status Distribution</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(clinData.statusBreakdown || []).map((st, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <span className="font-bold text-slate-800">{st._id}</span>
                    <span className="px-2.5 py-1 bg-slate-100 font-bold rounded-lg text-slate-700">{st.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
