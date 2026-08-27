import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  BedDouble,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  UserPlus,
  Receipt,
  Pill,
  Stethoscope,
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const { formatCurrency } = useHospitalConfig();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getStats();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const overview = data?.overview || {};
  const charts = data?.charts || {};
  const docData = data?.doctorSpecificData;

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {user?.role} Portal
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time overview of hospital admissions, outpatient flow, and clinical operations.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Link
            to="/patients"
            className="px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Patients
          </Link>
          <Link
            to="/appointments"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center border border-slate-700"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Appointments
          </Link>
          <Link
            to="/billing"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center border border-slate-700"
          >
            <Receipt className="w-3.5 h-3.5 mr-1.5" />
            Billing
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={overview.totalPatients || 0}
          subtitle={`+${overview.newPatientsToday || 0} registered today`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Today's Appointments"
          value={overview.todayAppointments || 0}
          subtitle="Scheduled outpatient visits"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${overview.occupiedBeds || 0} / ${overview.totalBeds || 0}`}
          subtitle={`${overview.availableBeds || 0} beds available (${overview.occupancyRate || 0}%)`}
          icon={BedDouble}
          color="emerald"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(overview.todayRevenue || 0)}
          subtitle={`Monthly: ${formatCurrency(overview.monthRevenue || 0)}`}
          icon={DollarSign}
          color="cyan"
        />
      </div>

      {/* Secondary Alerts & Dues Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 uppercase">Pharmacy Low Stock Alert</div>
            <div className="text-sm font-semibold text-amber-800">
              {overview.lowStockMedsCount || 0} medicine(s) below reorder level
            </div>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-900 uppercase">Expiring Medicine Stock</div>
            <div className="text-sm font-semibold text-rose-800">
              {overview.expiringMedsCount || 0} medicine batch(es) within 90 days
            </div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-900 uppercase">Pending Outstanding Dues</div>
            <div className="text-sm font-semibold text-blue-800">
              {formatCurrency(overview.totalPendingDue || 0)} across {overview.pendingInvoicesCount || 0} invoice(s)
            </div>
          </div>
        </div>
      </div>

      {/* Doctor-Specific Queue (If Doctor role) */}
      {docData && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-slate-800">My Consultation Queue Today</h2>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View Schedule →
            </Link>
          </div>
          {docData.todayAppointmentsList?.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No appointments scheduled for today</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {docData.todayAppointmentsList?.map((apt) => (
                <div key={apt._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700">
                      {apt.patient?.firstName?.[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {apt.patient?.firstName} {apt.patient?.lastName} ({apt.patient?.patientId})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt.patient?.age} yrs • {apt.patient?.gender} • Reason: {apt.reasonForVisit || 'Checkup'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold text-slate-600">{apt.timeSlot}</span>
                    <Badge status={apt.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue Collections</h2>
              <p className="text-xs text-slate-400">Monthly billing trends</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Bar Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Department Caseload</h2>
              <p className="text-xs text-slate-400">Distribution of patient appointments</p>
            </div>
            <Activity className="w-5 h-5 text-primary-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.departmentDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Logs */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Recent Hospital Operations & Audit Feed</h2>
          <Link to="/audit-logs" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            View All Logs →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {(data?.recentActivities || []).map((activity) => (
            <div key={activity._id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <div>
                  <span className="font-semibold text-slate-800">{activity.details}</span>
                  <span className="text-slate-400 ml-2">by {activity.userName} ({activity.userRole})</span>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{formatDate(activity.createdAt, true)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
