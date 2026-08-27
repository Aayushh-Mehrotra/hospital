import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  UserCheck,
  Building2,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  BedDouble,
  DoorOpen,
  Receipt,
  CreditCard,
  Package,
  Truck,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog,
  HeartPulse,
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useHospitalConfig } from '../context/HospitalConfigContext';

export const DashboardLayout = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const { settings } = useHospitalConfig();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Navigation Items with RBAC visibility
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Activity, roles: ['All'] },
    { label: 'Patients', path: '/patients', icon: Users, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Receptionist', 'Nurse'] },
    { label: 'Doctors', path: '/doctors', icon: UserCheck, roles: ['Super Admin', 'Hospital Admin', 'Receptionist'] },
    { label: 'Departments', path: '/departments', icon: Building2, roles: ['Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor'] },
    { label: 'Appointments', path: '/appointments', icon: Calendar, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Receptionist'] },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse'] },
    { label: 'Prescriptions', path: '/prescriptions', icon: Pill, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Pharmacist', 'Nurse'] },
    { label: 'Laboratory', path: '/laboratory', icon: FlaskConical, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Laboratory Staff', 'Nurse'] },
    { label: 'Wards & Beds', path: '/wards-beds', icon: BedDouble, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist'] },
    { label: 'Admissions', path: '/admissions', icon: DoorOpen, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist'] },
    { label: 'Billing & Invoices', path: '/billing', icon: Receipt, roles: ['Super Admin', 'Hospital Admin', 'Accountant', 'Receptionist'] },
    { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['Super Admin', 'Hospital Admin', 'Accountant', 'Receptionist'] },
    { label: 'Pharmacy', path: '/pharmacy', icon: Pill, roles: ['Super Admin', 'Hospital Admin', 'Pharmacist', 'Doctor'] },
    { label: 'Inventory', path: '/inventory', icon: Package, roles: ['Super Admin', 'Hospital Admin', 'Pharmacist', 'Nurse'] },
    { label: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['Super Admin', 'Hospital Admin', 'Pharmacist'] },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['Super Admin', 'Hospital Admin', 'Accountant'] },
    { label: 'User Management', path: '/users', icon: UserCog, roles: ['Super Admin', 'Hospital Admin'] },
    { label: 'Roles & Permissions', path: '/roles', icon: ShieldCheck, roles: ['Super Admin'] },
    { label: 'Hospital Settings', path: '/settings', icon: Settings, roles: ['Super Admin', 'Hospital Admin'] },
    { label: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['Super Admin', 'Hospital Admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === 'Super Admin') return true;
    if (item.roles.includes('All')) return true;
    return item.roles.includes(user?.role);
  });

  const handleRoleSelect = async (cred) => {
    try {
      await switchDemoRole(cred.email, cred.pass);
      setRoleSwitcherOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Role switch error:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/60">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight font-sans">
                Care<span className="text-primary-400">Pulse</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Hospital OS
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-4 py-3 bg-slate-950/30 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white truncate">{user?.fullName}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-900/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-slate-800">{settings.hospitalName}</span>
              <span className="text-xs text-slate-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                Emergency: <strong className="ml-1 text-slate-600">{settings.emergencyHelpline}</strong>
              </span>
            </div>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center space-x-3">
            {/* Demo Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                title="Switch role instantly to test role-based access"
              >
                <span>Role: {user?.role}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {roleSwitcherOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setRoleSwitcherOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Role for Evaluation
                    </div>
                    {DEMO_CREDENTIALS.map((cred) => (
                      <button
                        key={cred.email}
                        onClick={() => handleRoleSelect(cred)}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 transition-colors ${
                          user?.email === cred.email ? 'bg-primary-50/70 font-bold text-primary-900' : 'text-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{cred.label}</span>
                        <span className="text-[10px] text-slate-400">{cred.desc}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-xs font-bold text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-primary-600 hover:text-primary-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markAsRead(n._id)}
                            className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.isRead ? 'bg-primary-50/40' : ''
                            }`}
                          >
                            <div className="font-semibold text-slate-800">{n.title}</div>
                            <div className="text-slate-500 mt-0.5">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationDropdownOpen(false)}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        View All Alerts →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">{user?.fullName}</span>
                <span className="text-[10px] text-slate-500">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
