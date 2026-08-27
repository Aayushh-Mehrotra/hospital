import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Check, X, ShieldAlert } from 'lucide-react';
import { roleApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';

export const RolesPermissions = () => {
  const { showToast } = useNotification();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await roleApi.getAll();
      if (res.data.success) {
        setRoles(res.data.roles);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const permissionModules = [
    { key: 'patients', label: 'Patient Management & EMR 360' },
    { key: 'appointments', label: 'Appointments & Scheduling' },
    { key: 'medicalRecords', label: 'Clinical Encounters (EMR)' },
    { key: 'prescriptions', label: 'Prescriptions & Dispensing' },
    { key: 'laboratory', label: 'Diagnostic Laboratory & Reports' },
    { key: 'wardsBeds', label: 'Wards & Bed Allocation' },
    { key: 'admissions', label: 'Inpatient Admissions (IPD)' },
    { key: 'billing', label: 'Invoicing & Payments Ledger' },
    { key: 'pharmacy', label: 'Pharmacy Formulary & Stock' },
    { key: 'inventory', label: 'Hospital Supplies & Procurement' },
    { key: 'users', label: 'Staff Accounts Management' },
    { key: 'settings', label: 'Hospital Configuration' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Role-Based Access Control (RBAC)</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Granular permission matrix governing feature authorization for all 8 hospital roles.
        </p>
      </div>

      {/* Roles Cards & Matrix */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-2 text-xs text-slate-400">Loading RBAC security matrix...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Roles Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div key={role._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{role.name}</h3>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Role Profile</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{role.description}</p>
              </div>
            ))}
          </div>

          {/* Permissions Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-extrabold text-sm text-slate-900">
              Feature Permission Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4 min-w-[200px]">System Module</th>
                    {roles.map((r) => (
                      <th key={r._id} className="py-3 px-3 text-center min-w-[110px]">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissionModules.map((mod) => (
                    <tr key={mod.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{mod.label}</td>
                      {roles.map((r) => {
                        const hasAccess =
                          r.name === 'Super Admin' ||
                          r.name === 'Hospital Admin' ||
                          (r.permissions && r.permissions.includes(mod.key)) ||
                          (r.name === 'Doctor' && ['patients', 'appointments', 'medicalRecords', 'prescriptions', 'laboratory', 'admissions'].includes(mod.key)) ||
                          (r.name === 'Nurse' && ['patients', 'appointments', 'admissions', 'wardsBeds'].includes(mod.key)) ||
                          (r.name === 'Pharmacist' && ['prescriptions', 'pharmacy', 'inventory'].includes(mod.key)) ||
                          (r.name === 'Laboratory Staff' && ['laboratory', 'patients'].includes(mod.key)) ||
                          (r.name === 'Accountant' && ['billing', 'patients'].includes(mod.key)) ||
                          (r.name === 'Receptionist' && ['patients', 'appointments', 'admissions', 'billing'].includes(mod.key));

                        return (
                          <td key={r._id} className="py-3 px-3 text-center">
                            {hasAccess ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
